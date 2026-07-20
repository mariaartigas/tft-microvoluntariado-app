import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { BehaviorSubject, combineLatest, from, map, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { OrganizationModel, RecentTaskSummary } from '../../shared/models/organization.model';
import { OrganizationService } from '../../core/services/organization.service';
import { UserService } from '../../core/services/user.service';

import { UserModel } from '../../shared/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { EditProfileModalComponent } from './components/edit-profile-modal/edit-profile-modal.component';

//Modelo base de la página !
export interface ProfileState {
  uid: string;
  displayName: string;
  organizationOwnerId?: string;
  logoURL: string | null;
  description: string;
  email: string;
  //phone?: string;
  badges: string[];
  tasks: RecentTaskSummary[];
  extraContent: string[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './profile-dashboard.component.html',
  styleUrls: ['./profile-dashboard.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})

export class ProfileDashboardPageComponent {

  private route = inject(ActivatedRoute);
  private router = inject(Router); // 💡 Inyectamos Router
  private orgService = inject(OrganizationService);
  private userService = inject(UserService);
  private auth = inject(AuthService);

  private modalCtrl = inject(ModalController);

  // Disparador reactivo para refrescar datos cuando se guarde en el modal
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  //unificación
  isOrgMode = computed(() => this.profileType() === 'org');

  //detectar tipo de perfil con Signals
  profileType = toSignal( this.route.url.pipe( map(segments => segments.some(s => s.path === 'user') ? 'user' : 'org') ),
    { initialValue: 'user' as 'user' | 'org' }
  );

  //sección sobre tareas ------------
  localAddedTasks = signal<RecentTaskSummary[]>([]);

  displayTasks = computed(() => { const serverTasks = this.profileData()?.tasks || [];
    return [...serverTasks, ...this.localAddedTasks()];
  });

  tasksTitle = computed(() => {
    return this.isOrgMode() ? 'Tareas bajo Gestión / Solicitadas' : 'Mis Tareas en Progreso';
  });

  aboutTitle = computed(() => {
    return this.isOrgMode() ? 'Sobre la Empresa' : 'Reseñas de mis Tareas';
  });

  //método de añadir una nueva tarea
  public addNewTask(title: any, modalInstance: any) {
    const taskTitle = title?.toString().trim();
    
    if (!taskTitle) return; // validación super básica por si aca

    const newTask = { title: taskTitle, status: 'Activa' }; //DUMMY
    
    const newTasks: RecentTaskSummary = { taskId: 'id_temporal_' + Date.now(),  title: taskTitle,description: 'Nueva tarea creada desde el panel',status: 'Activa' };


    // Actualizamos el signal local inyectando la nueva tarea
    this.localAddedTasks.update(currentTasks => [newTasks, ...currentTasks]);


    //  PRÓXIMAMENTE EN FIREBASE:
    // En lugar de crear un documento en otra colección, haces un update al documento de la ONG:
    // await updateDoc(doc(db, 'organizations', orgId), {
    //   recentTasks: arrayUnion(newTask)
    // });
    // Cerramos el modal de forma limpia --> esto que es exactamente?
    modalInstance.dismiss();
}

//sección sobre PERFIL ------------

 // Carga limpia según el tipo de ruta real
  private profileStream$ = combineLatest([ this.route.paramMap,this.refreshTrigger$]).pipe(
   switchMap(([params]) => { 
    const paramValue = params.get('username') || params.get('slug');
    if (!paramValue) return of(null);

    return this.isOrgMode() 
      ? this.orgService.getBySlug$(paramValue).pipe(map(org => org ? this.mapOrgToProfile(org) : null))
      : this.userService.getByUsername$(paramValue).pipe(map(user => user ? this.mapUserToProfile(user) : null));
  })
  );


  //signals que son parecidos a los observables
  profileData = toSignal(this.profileStream$, { initialValue: null });

 isEditable = computed(() => {
    const loggedUser = this.auth.currentUser();
    const profile = this.profileData();

    if (!loggedUser || !profile) {
      return false;
    }

    if (this.isOrgMode()) {
        // PRG
      const isOwner = (profile as any).organizationOwnerId === loggedUser.uid;

      // 2. ¿Tiene la ONG asignada en su usuario? (Por si acaso)
      const isMember = (loggedUser as any).organizationId === profile.uid;
      return isOwner || isMember;
    } else {
        //USER
        return loggedUser.uid === profile.uid;
    }
  });

  //EDITANDO ACTUALMENTE 

  //  Abre el Modal de Edición de forma limpia
  async openEditModal() {
    const currentProfile = this.profileData();
    if (!currentProfile) return;

    const modal = await this.modalCtrl.create({
      component: EditProfileModalComponent,
      cssClass: 'custom-edit-modal',
      componentProps: {
        profileData: currentProfile,
        isOrgMode: this.isOrgMode()
      }
    });

    await modal.present();

    const { data: updated, role } = await modal.onWillDismiss();

    // Si se guardó correctamente, notificamos a refreshTrigger$ para recargar la data de Firestore
    if (role === 'confirm' && updated) {
      this.refreshTrigger$.next();
    }
  }
  
// Guardar Cambios en Firebase + Local-----------------------------------------------------------------AÑADIDO
// --- MÉTODOS DE MAPEO (Adaptadores) ---
  private mapUserToProfile(user: UserModel): ProfileState {
    return {
      uid: user.uid,
      displayName: user.displayName || user.username,
      logoURL: user.photoURL,
      description: user.bio || 'Sin descripción personal introducida.',
      email: user.email,
      badges: user.badges || [`XP: ${user.xp || 0}`, `Reputación: ${user.reputation || 0}`],
      tasks: [],
      extraContent: user.interests || []
    };
  }

  private mapOrgToProfile(org: OrganizationModel): ProfileState {
    return {
      uid: org.uid,
      organizationOwnerId: org.ownerId, //PARA REVISAR SI SE TRATA DE ALGUIEN QUE PUEDE EDITAR!
      displayName: org.displayName,
      logoURL: org.logoURL,
      description: org.description || 'Sin descripción corporativa disponible.',
      email: org.email,
      badges: ['Organización Verificada'],
      tasks: org.recentTasks || [],
      extraContent: []
    };
  }

}
