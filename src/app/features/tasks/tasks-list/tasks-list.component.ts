import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonSpinner, IonAccordionGroup, IonAccordion, IonItem, IonInfiniteScroll, IonInfiniteScrollContent, IonFab, IonFabButton, IonButton, ModalController, AlertController, ToastController} from '@ionic/angular/standalone';
import { BehaviorSubject, catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QueryDocumentSnapshot } from '@angular/fire/firestore';

import { TaskQueryScope, TaskService } from '../../../core/services/task.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrchestratorService } from '../../../core/services/orchestrator.service';
import { TaskModel, TaskStatus } from '../../../shared/models/task.model';
import { OrganizationModel } from '../../../shared/models/organization.model';
import { TaskDetailModalComponent } from '../task-detail-modal/task-detail-modal.component';
import { TaskFormModalComponent } from '../task-form-modal/task-form-modal.component';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-tasks-list',
  templateUrl: './tasks-list.component.html',
  styleUrls: ['./tasks-list.component.scss'],
  standalone: true,
  imports: [ DatePipe,  IonContent,  IonSpinner,  IonAccordionGroup,  IonAccordion,  IonItem,  IonInfiniteScroll,  IonInfiniteScrollContent,  IonFab,  IonFabButton,  IonButton]
})

export class TasksListComponent {
  private route = inject(ActivatedRoute);
  private orchestrator = inject(OrchestratorService);
  private taskService = inject(TaskService);
  private userService = inject(UserService);
  private orgService = inject(OrganizationService);
  private auth = inject(AuthService);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  // Signals de Estado
  tasks = signal<TaskModel[]>([]);
  isLoading = signal(true);
  currentOrg = signal<OrganizationModel | null>(null);
  lastVisible = signal<QueryDocumentSnapshot | null>(null);

  mode: 'org' | 'user' | 'all' = 'org';
  private targetId: string | null = null;
  private isFetching = false; // Flag para evitar peticiones solapadas

  currentUser = computed(() => this.auth.currentUser());

  isOwner = computed(() => {
    const user = this.currentUser();
    const org = this.currentOrg();
    if (this.mode !== 'org' || !user?.uid || !org) return false;
    return org.ownerId === user.uid || org.uid === user.uid;
  });

  //recarga pipeline

  private routeTarget$ = combineLatest([ this.route.url, this.route.paramMap, this.refreshTrigger$]).pipe(
    switchMap(([urlSegments, params]) => {
      const parentParams = this.route.parent?.snapshot.paramMap;
      const username = params.get('username') || parentParams?.get('username');
      const slug = params.get('slug') || parentParams?.get('slug');

      const fullUrl = this.route.snapshot.pathFromRoot
        .flatMap(r => r.url.map(segment => segment.path))
        .join('/');

      const rawMode = this.route.snapshot.data['mode'];

      if (rawMode === 'volunteer' || rawMode === 'user' || fullUrl.includes('user') || username) {
        this.mode = 'user';
      } else if (slug || fullUrl.includes('org')) {
        this.mode = 'org';
      } else {
        this.mode = 'all';
      }

      if (this.mode === 'org') {
        const orgParam = slug || username;
        if (!orgParam) return of(null);

        return this.orgService.getOrganizationBySlugOrId$(orgParam).pipe(
          map(org => {
            this.currentOrg.set(org || null);
            return org?.uid || orgParam;
          }),
          catchError(() => {
            this.currentOrg.set(null);
            return of(null);
          })
        );
      } else if (this.mode === 'user') {
        this.currentOrg.set(null);
        const userParam = username;

        if (!userParam) {
          return of(this.currentUser()?.uid || null);
        }

        return this.userService.getByUsername$(userParam).pipe(
          map(user => user?.uid || userParam),
          catchError(() => of(userParam))
        );
      } else {
        this.currentOrg.set(null);
        return of('all');
      }
    })
  );

  //constructor para el subscribe y la recarga dinámica de la página
  constructor() {
    this.routeTarget$.pipe(takeUntilDestroyed()).subscribe((targetId) => {
      this.targetId = targetId;
      this.resetAndLoadTasks();
    });
  }

  async resetAndLoadTasks() {
    this.isLoading.set(true);
    this.tasks.set([]);
    this.lastVisible.set(null);
    await this.loadTasks();
    this.isLoading.set(false);
  }

//carga de las tareas en pantalla
  async loadTasks(event?: any) {
    if (this.isFetching) return; // Evita llamadas simultáneas
    if (this.mode !== 'all' && !this.targetId) {
      if (event) event.target.complete();
      return;
    }

    this.isFetching = true;

    let scope: TaskQueryScope;
    if (this.mode === 'org') {
      scope = { type: 'org', orgId: this.targetId! };
    } else if (this.mode === 'user') {
      scope = { type: 'user', volunteerId: this.targetId! };
    } else {
      scope = { type: 'all' };
    }

    try {
      const result = await this.taskService.getTasksPaginated(scope, 10, this.lastVisible());

      // Deduplicación estricta por UID antes de guardar en el Signal
      this.tasks.update(current => {
        const map = new Map<string, TaskModel>();
        [...current, ...result.tasks].forEach(t => map.set(t.uid, t));
        return Array.from(map.values());
      });

      this.lastVisible.set(result.lastVisible);

      if (event) {
        event.target.complete();
        if (!result.lastVisible) {
          event.target.disabled = true;
        }
      }
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      if (event) event.target.complete();
    } finally {
      this.isFetching = false;
    }
  }

  // --- ACCIONES DE ONG ---

  //abrir la opción de adición de tarea !
  async openAddTaskModal() {
    if (!this.targetId || !this.isOwner()) return;

    const modal = await this.modalCtrl.create({
      component: TaskFormModalComponent,
      componentProps: {
        orgId: this.targetId,
        orgDisplayName: this.currentOrg()?.displayName || 'Organización',
        orgLogoURL: this.currentOrg()?.logoURL || null
      }
    });

    await modal.present();
    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.tasks.update(current => {
        const exists = current.some(t => t.uid === data.uid);
        return exists ? current : [data, ...current];
      });
    }
  }

  //eliminación de tarea

  async deleteTask(task: TaskModel) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Tarea',
      message: `¿Estás seguro de eliminar "${task.title}"? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.orchestrator.deleteTaskAndSync(task);
              this.tasks.update(list => list.filter(t => t.uid !== task.uid));
              await this.showToast('Tarea eliminada correctamente', 'success');
            } catch (error) {
              console.error('[TasksList] Error al eliminar la tarea:', error);
              await this.showToast('Error al eliminar la tarea', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  //visualización de detalles !
  async openTaskDetailModal(task: TaskModel) {
    const modal = await this.modalCtrl.create({
      component: TaskDetailModalComponent,
      componentProps: { task }
    });

    await modal.present();
    const { role } = await modal.onDidDismiss();

    if (role === 'claimed') {
      const user = this.currentUser();
      this.tasks.update(list =>
        list.map(t =>
          t.uid === task.uid
            ? {
                ...t,
                status: 'En Curso' as TaskStatus,
                assignedVolunteerId: user?.uid || null,
                assignedVolunteerName: user?.displayName || 'Voluntario'
              }
            : t
        )
      );
    }
  }
// --- ACCIONES DE VOLUNTARIO ---
  async unclaimTask(task: TaskModel) {
    const alert = await this.alertCtrl.create({
      header: 'Abandonar Tarea',
      message: 'Si abandonas la tarea registrada, se contabilizará un abandono en tu perfil. ¿Deseas continuar?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Abandonar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.orchestrator.unclaimTaskAndPenalize(task.uid);

              if (this.mode === 'user') {
                this.tasks.update(list => list.filter(t => t.uid !== task.uid));
              } else {
                this.tasks.update(list =>
                  list.map(t =>
                    t.uid === task.uid
                      ? { ...t, status: 'Activa' as TaskStatus, assignedVolunteerId: null, assignedVolunteerName: null }
                      : t
                  )
                );
              }
              await this.showToast('Has abandonado la tarea', 'warning');
            } catch (error) {
              console.error('[TasksList] Error al abandonar tarea:', error);
              await this.showToast('Error al procesar la solicitud', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  //status de tarea

  getStatusClass(status: TaskStatus): string {
    switch (status) {
      case 'Activa': return 'status-activa';
      case 'En Curso': return 'status-en-curso';
      case 'Pendiente de Revisión': return 'status-revision';
      case 'Completada': return 'status-completada';
      case 'Cancelada': return 'status-cancelada';
      default: return 'status-default';
    }
  }

  //visualziación de mensajito

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
      mode: 'ios'
    });
    await toast.present();
  }
}