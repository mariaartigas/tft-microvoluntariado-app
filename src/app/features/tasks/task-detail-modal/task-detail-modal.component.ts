import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IonSpinner, ModalController, ToastController } from '@ionic/angular/standalone';
import { OrchestratorService } from '../../../core/services/orchestrator.service';
import { AuthService } from '../../../core/services/auth.service';
import { TaskModel } from '../../../shared/models/task.model';

@Component({
  selector: 'app-task-detail-modal',
  templateUrl: './task-detail-modal.component.html',
  styleUrls: ['./task-detail-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, DatePipe, IonSpinner]
})

export class TaskDetailModalComponent {
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private orchestrator = inject(OrchestratorService);
  private auth = inject(AuthService);

  @Input({ required: true }) task!: TaskModel;

  isClaiming = signal<boolean>(false);

  //cancelar acción
  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  //apuntarse a una tarea como voluntario
  async claimTask(): Promise<void> {
    const currentUser = this.auth.currentUser();
    if (!currentUser) {
      await this.showToast('Debes iniciar sesión para colaborar', 'danger');
      return;
    }

    this.isClaiming.set(true);

    try {
      const volunteer = {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Voluntario'
      };

      // asignación de la tarea con el orquestador !!
      await this.orchestrator.claimTaskForVolunteer(this.task.uid, volunteer);

      await this.showToast('¡Te has apuntado a la tarea!', 'success');
      this.modalCtrl.dismiss(this.task.uid, 'claimed');
    } catch (error) {
      console.error('[TaskDetailModal] Error al reclamar tarea:', error);
      await this.showToast('Error al procesar la solicitud', 'danger');
    } finally {
      this.isClaiming.set(false);
    }
  }
//visualización 
  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
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