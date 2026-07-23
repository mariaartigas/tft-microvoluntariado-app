import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { BehaviorSubject, catchError, combineLatest, from, map, of, switchMap, take, distinctUntilChanged } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { OrganizationModel } from '../../shared/models/organization.model';
import { OrganizationService } from '../../core/services/organization.service';
import { UserService } from '../../core/services/user.service';
import { TaskQueryScope, TaskService } from '../../core/services/task.service';
import { OrchestratorService } from '../../core/services/orchestrator.service'; // <--- Importado
import { UserModel } from '../../shared/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { EditProfileModalComponent } from './components/edit-profile-modal/edit-profile-modal.component';
import { TaskSummary, toTaskSummary } from '../../shared/models/task.model';
import { FooterComponent } from "../../shared/components/footer/footer.component";

//interfaz utilizada para pantalla de USERS y ORGs

export interface ProfileState {
  uid: string;
  displayName: string;
  organizationOwnerId?: string;
  logoURL?: string;
  photoURL?: string | null;
  description: string;
  email: string;
  slug?: string;
  username?: string;
  badges: string[];
  tasks: TaskSummary[];
  extraContent: string[];
  reviews?: string[];
  xp?: number;        
  reputation?: number;
  reliability?: number; 
}

//---

@Component({
  selector: 'app-dashboard',
  templateUrl: './profile-dashboard.component.html',
  styleUrls: ['./profile-dashboard.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink, FooterComponent]
})

export class ProfileDashboardPageComponent {

  private  route = inject(ActivatedRoute);
  private  router = inject(Router); 
  private  orgService = inject(OrganizationService);
  private  userService = inject(UserService);
  private  taskService = inject(TaskService);
  private  orchestrator = inject(OrchestratorService); // <--- Inyectado
  private  auth = inject(AuthService);
  private  modalCtrl = inject(ModalController);
  private  alertCtrl = inject(AlertController); // <--- Para confirmación de borrado

  //gestión de refresh de pantalla por cambios
  private  refreshTrigger$ = new BehaviorSubject<void>(undefined);

  isOrgMode = computed(() => this.profileType() === 'org');

  readonly  profileType = toSignal(
    this.route.url.pipe(map(segments => segments.some(s => s.path === 'user') ? 'user' : 'org')),
    { initialValue: 'user' as 'user' | 'org' }
  );

   readonly tasksTitle = computed(() => {
    return this.isOrgMode() ? 'Tareas bajo Gestión / Solicitadas' : 'Mis Tareas';
  });

  readonly  aboutTitle = computed(() => {
    return this.isOrgMode() ? 'Sobre la Empresa' : 'Sobre mí';
  });

  //flujo de perfil mostrado
  private  profileStream$ = combineLatest([this.route.paramMap, this.refreshTrigger$]).pipe(
    switchMap(([params]) => { 
      const paramValue = params.get('username') || params.get('slug');
      if (!paramValue) return of(null);
      //modo organización
      if (this.isOrgMode()) {
        return this.orgService.getBySlug$(paramValue).pipe(
          switchMap(org => {
            if (!org) return of(null);

            // Consulta dinámica de tareas creadas por la ONG en Firestore
            const queryScope: TaskQueryScope = {type: 'org',  orgId: org.uid };

            return this.taskService.getTasks$(queryScope).pipe(
              distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
              map(tasks => this.mapOrgToProfile(org, tasks.map(t => toTaskSummary(t)))),
              catchError(err => {
                console.error('Error al cargar tareas de la organización:', err);
                return of(this.mapOrgToProfile(org, org.recentTasks || []));
              })
            );
          }),
          catchError(err => {
            console.error('Error al cargar la organización:', err);
            return of(null);
          })
        );
      } else {
        return this.userService.getByUsername$(paramValue).pipe(
          switchMap(user => {
            if (!user) return of(null);

            // Consulta combinada y reactiva para tareas en curso y tareas completadas (reseñas)
            const inProgressScope: TaskQueryScope = { type: 'user', volunteerId: user.uid, status: 'En Curso' };
            const completedScope: TaskQueryScope = { type: 'user', volunteerId: user.uid, status: 'Completada' };

            return combineLatest([ this.taskService.getTasks$(inProgressScope), this.taskService.getTasks$(completedScope)]).pipe(
              distinctUntilChanged(([prevIn, prevComp], [currIn, currComp]) => 
                JSON.stringify(prevIn) === JSON.stringify(currIn) && JSON.stringify(prevComp) === JSON.stringify(currComp)
              ),
              map(([inProgressTasks, completedTasks]) => {
                // Extraemos las notas de feedback de las tareas completadas que tengan reseña
                const reviews = completedTasks
                  .filter(t => t.feedbackNote && t.feedbackNote.trim() !== '')
                  .map(t => t.feedbackNote!);

                return this.mapUserToProfile(user, inProgressTasks.map(t => toTaskSummary(t)), reviews);
              }),
      catchError(err => {
        console.error('[ProfileDashboard] Error al cargar datos del usuario:', err);
                return of(this.mapUserToProfile(user, [], []));
              })
            );
          })
        );
      }
    })
  );

  //signal de dicho perfil
   profileData = toSignal(this.profileStream$, { initialValue: null });

  //revisa si el perfil visible es editable
   isEditable = computed(() => {
    const loggedUser = this.auth.currentUser();
    const profile = this.profileData();

    if (!loggedUser || !profile) return false;

    if (this.isOrgMode()) {
      const isOwner = (profile as any).organizationOwnerId === loggedUser.uid;
      const isMember = (loggedUser as any).organizationId === profile.uid;
      return isOwner || isMember;
    } else {
      return loggedUser.uid === profile.uid;
    }
  });

  //para apertura de pestaña de edición
  async openEditModal() {
    const currentProfile = this.profileData();
    if (!currentProfile) return;

    const modal = await this.modalCtrl.create({component: EditProfileModalComponent,   cssClass: 'custom-edit-modal',   componentProps: {  profileData: currentProfile, isOrgMode: this.isOrgMode() } });

    await modal.present();

    const { data: updated, role } = await modal.onWillDismiss();

    if (role === 'confirm' && updated) {
      this.refreshTrigger$.next();
    }
  }

  // acción delegada al orquestador! revisar el tema de los textos etc
  async confirmDeleteAccount() {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar cuenta?',
      message: 'Esta acción es irreversible y borrará todos tus datos y accesos asociados.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, eliminar',
          handler: async () => {
            try {
              if (this.isOrgMode()) {
                await this.orchestrator.deleteOrganizationAccount();
              } else {
                await this.orchestrator.deleteVolunteerAccount();
              }
              this.router.navigate(['/']);
            } catch (error) {
              console.error('Error al eliminar la cuenta:', error);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  //mapeos de profileState

 private mapUserToProfile(user: UserModel, tasks: TaskSummary[] = [], reviews: string[] = []): ProfileState {
  return {
    uid: user.uid,
    displayName: user.displayName || user.username,
    photoURL: user.photoURL,
    username: user.username,
    description: user.bio || 'Sin descripción personal introducida.',
    email: user.email,
    badges: user.badges || [`Fiabilidad: ${user.reliability ?? 100}%`, `Reputación: ${user.reputation || 0}`],
    tasks: tasks,
    reviews: reviews.length > 0 ? reviews : ['No hay reseñas registradas todavía.'],
    extraContent: user.interests || [],
    xp: user.xp ?? 0,                     
    reputation: user.reputation ?? 0,     
    reliability: user.reliability ?? 100 // por defecto en todo el mundo empieza al 100% !
  };
}

  private mapOrgToProfile(org: OrganizationModel, tasks: TaskSummary[] = []): ProfileState {
    return {
      uid: org.uid,
      organizationOwnerId: org.ownerId,
      displayName: org.displayName,
      logoURL: org.logoURL,
      slug: org.slug,
      description: org.description || 'Sin descripción corporativa disponible.',
      email: org.email,
      badges: ['Organización Verificada'],
      tasks: tasks.length > 0 ? tasks : (org.recentTasks || []),
      extraContent: []
    };
  }
}