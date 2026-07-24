import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonSpinner, ModalController, ToastController, IonContent } from '@ionic/angular/standalone';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-form-modal.component.html',
  styleUrls: ['./task-form-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonSpinner, ReactiveFormsModule, IonContent]
})

export class TaskFormModalComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private taskService = inject(TaskService);
  private auth = inject(AuthService);
  private fb = inject(NonNullableFormBuilder);

  @Input({ required: true }) orgId!: string;
  @Input() isOrgMode: boolean = false; // true = Crear/Editar (ONG), false = Detalle (Voluntario)
  @Input() orgDisplayName: string = 'Organización';
  @Input() orgLogoURL: string | null = null;
  @Input() taskData?: any;

  isSaving = signal<boolean>(false);
  
  taskForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    estimatedTime: ['', [Validators.required, Validators.maxLength(30)]],
    deadline: ['', [Validators.required]],
    description: ['', [Validators.maxLength(1000)]]
  });

 ngOnInit() {
    if (this.taskData) {
      const formattedDeadline = this.taskData.deadline 
        ? new Date(this.taskData.deadline).toISOString().split('T')[0] 
        : '';

      this.taskForm.patchValue({
        title: this.taskData.title || '',
        estimatedTime: this.taskData.estimatedTime || '',
        deadline: formattedDeadline,
        description: this.taskData.description || ''
      });
    }
  }
  //cancelar la acción/salir

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  //guardar la acción

  async save() {
    if (this.taskForm.invalid || !this.orgId) {
      this.taskForm.markAllAsTouched();
      await this.showToast('Por favor, completa los campos obligatorios', 'danger');
      return;
    }

    this.isSaving.set(true);
    const { title, estimatedTime, deadline, description } = this.taskForm.getRawValue();

    try {
      const orgInfo = { uid: this.orgId, displayName: this.orgDisplayName, logoURL: this.orgLogoURL };

      //se crea la tarea
      const createdTask = await this.taskService.createTask( title.trim(), orgInfo, description.trim() || 'Sin descripción', 'Manual',estimatedTime.trim(), new Date(deadline));

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
      const volunteer = {uid: currentUser.uid, displayName: currentUser.displayName || 'Voluntario'};

      // Asignación directa en 1 solo paso
      await this.taskService.claimTask(taskId, volunteer);

      await this.showToast('¡Te has apuntado a la tarea!', 'success');
      this.modalCtrl.dismiss(taskId, 'claimed');

    } catch (error) {
        console.error('Error al reclamar tarea:', error);
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