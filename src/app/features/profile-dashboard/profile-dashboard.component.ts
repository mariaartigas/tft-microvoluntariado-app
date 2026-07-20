import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { from, map, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { OrganizationModel, RecentTaskSummary } from '../../shared/models/organization.model';
import { OrganizationService } from '../../core/services/organization.service';
import { UserService } from '../../core/services/user.service';

import { UserModel } from '../../shared/models/user.model';
import { AuthService } from '../../core/services/auth.service';

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
  private profileStream$ = this.route.paramMap.pipe(
    switchMap(params => { 
      // Leemos cualquier parámetro que tenga la ruta (:username, :slug, :id, etc.)
      const paramValue = params.get('username') || params.get('slug') || params.get('id');

      if (!paramValue) return of(null);

      // Si NO es modo Org, es un usuario
      if (!this.isOrgMode()) {
        return this.userService.getByUsername$(paramValue).pipe(
          map(user => user ? this.mapUserToProfile(user) : null)
        );
      } else {
        // Si ES modo Org, cargamos la organización
        return from(this.orgService.getBySlug(paramValue)).pipe(
          map(org => org ? this.mapOrgToProfile(org) : null)
        );
      }
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
  

// Estado del botón de guardado en el modal
  isSaving = signal<boolean>(false);

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

  // --- SECCIÓN GUARDAR CAMBIOS ---
  

  async saveProfileChanges(formData: any, modalInstance: any) {
    const current = this.profileData();
    if (!current?.uid) return;

    this.isSaving.set(true);

    try {
      if (this.isOrgMode()) {
        const updatedOrg = {
          name: formData.displayName,
          description: formData.description,
          phone: formData.phone,
          logoUrl: formData.logoURL || null
        };
        // await this.orgService.updateOrgProfile(current.uid, updatedOrg);
      } else {
        const updatedUser = {
          displayName: formData.displayName,
          bio: formData.description,
          photoURL: formData.logoURL || null
        };
        // await this.userService.updateUserProfile(current.uid, updatedUser);
      }

      modalInstance.dismiss();
    } catch (error) {
      console.error('Error actualizando perfil:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

}
