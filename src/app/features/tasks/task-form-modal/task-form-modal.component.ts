import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonSpinner, IonItem, IonInput, IonTextarea, ModalController, ToastController} from '@ionic/angular/standalone';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-form-modal.component.html',
  styleUrls: ['./task-form-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, IonSpinner, IonItem, IonInput, IonTextarea]
})

export class TaskFormModalComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private taskService = inject(TaskService);
  private auth = inject(AuthService);

  @Input({ required: true }) orgId!: string;
  @Input() isOrgMode: boolean = false; // true = Crear/Editar (ONG), false = Detalle (Voluntario)
  @Input() orgDisplayName: string = 'Organización';
  @Input() orgLogoURL: string | null = null;
  @Input() taskData?: any;

  isSaving = signal<boolean>(false);
  
  title = '';
  description = '';
  estimatedTime = '';
  deadline = '';

  ngOnInit() {
    
    if (this.taskData) {
      this.title = this.taskData.title || '';
      this.description = this.taskData.description || '';
      this.estimatedTime = this.taskData.estimatedTime || '';
      this.deadline = this.taskData.deadline 
        ? new Date(this.taskData.deadline).toISOString().split('T')[0] 
        : '';
    } // Si viene una tarea ya creada y no es el dueño editando, cambiamos a modo vista/voluntario
    if (!this.isOrgMode) {
      this.isOrgMode = false;
    }
  }

  //cancelar la acción/salir

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async save() {
    const cleanTitle = this.title.trim().slice(0, 100);
    const cleanTime = this.estimatedTime.trim().slice(0, 30);
    const cleanDesc = this.description.trim().slice(0, 1000);

    if (!cleanTitle || !cleanTime || !this.deadline || !this.orgId) {
      await this.showToast('Por favor, completa los campos obligatorios', 'danger'); //verificación
      return;
    }

    this.isSaving.set(true);

    try {
      const orgInfo = {
        uid: this.orgId,
        displayName: this.orgDisplayName,
        logoURL: this.orgLogoURL
      };

      const createdTask = await this.taskService.createTask(
        cleanTitle,
        orgInfo,
        cleanDesc || 'Sin descripción',
        'Manual',
        cleanTime,
        new Date(this.deadline)
      );

      await this.showToast('Tarea creada exitosamente', 'success');
      this.modalCtrl.dismiss(createdTask, 'confirm');
    } catch (error) {
      console.error('[TaskDetail] Error al crear la tarea:', error);
      await this.showToast('Error al guardar la tarea. Permisos insuficientes.', 'danger');
    } finally {
      this.isSaving.set(false);
    }
  }


  //APUNTARSE A UNA TAREA !! funcionalidad importante

  async claimTask() {
  const currentUser = this.auth.currentUser();
  const taskId = this.taskData?.uid;

  if (!currentUser || !taskId) {
    await this.showToast('Debes iniciar sesión para colaborar', 'danger');
    return;
  }

  this.isSaving.set(true);

  try {
    const volunteer = {
      uid: currentUser.uid,
      displayName: currentUser.displayName || 'Voluntario'
    };

    // Asignación directa en 1 solo paso
    await this.taskService.claimTask(taskId, volunteer);

    await this.showToast('¡Te has apuntado a la tarea!', 'success');
    this.modalCtrl.dismiss(taskId, 'claimed');
  } catch (error) {
    console.error('[TaskDetail] Error al reclamar tarea:', error);
    await this.showToast('Error al procesar la solicitud', 'danger');
  } finally {
    this.isSaving.set(false);
  }
}


//toast
  private async showToast(message: string, color: 'success' | 'danger') {
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