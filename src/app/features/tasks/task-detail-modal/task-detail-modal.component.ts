import { Component, Input, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonSpinner, ModalController, ToastController, IonContent } from '@ionic/angular/standalone';
import { OrchestratorService } from '../../../core/services/orchestrator.service';
import { AuthService } from '../../../core/services/auth.service';
import { TaskModel } from '../../../shared/models/task.model';
import { AlertController } from '@ionic/angular'; 

@Component({
  selector: 'app-task-detail-modal',
  templateUrl: './task-detail-modal.component.html',
  styleUrls: ['./task-detail-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, IonSpinner, IonContent]
})

export class TaskDetailModalComponent {
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private orchestrator = inject(OrchestratorService);
  private auth = inject(AuthService);
  private alertController = inject(AlertController);

  @Input({ required: true }) task!: TaskModel;

  isProcessing = signal<boolean>(false);
  @Input() isOwner: boolean = false;
  // Campos para la entrega del voluntario
  proofNote = '';
  proofUrl = '';

  rejectFeedback = '';
  feedbackNote = '';

  // Detección de roles reactiva
  currentUser = computed(() => this.auth.currentUser());

  isAssignedVolunteer = computed(() => {
    const user = this.currentUser();
    if (!user || !this.task) return false;

    const volunteerId = this.task.assignedVolunteerId || (this.task as any).assignedVolunteer?.uid;
    return !!volunteerId && volunteerId === user.uid;
  });

  isOrgOwner = computed(() => {
    if (this.isOwner) return true;
    const user = this.currentUser();
    if (!user) return false;
    return this.task.orgId === user.uid;
  });

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  // Apuntarse a la tarea (Voluntario)
  async claimTask(): Promise<void> {
    const currentUser = this.currentUser();
    if (!currentUser) {
      await this.showToast('Debes iniciar sesión para colaborar', 'danger');
      return;
    }

    this.isProcessing.set(true);
    try {
      const volunteer = {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Voluntario'
      };

        await this.orchestrator.claimTaskForVolunteer(this.task.uid, volunteer);
        await this.showToast('¡Te has apuntado a la tarea!', 'success');
        this.modalCtrl.dismiss(this.task.uid, 'claimed');
    } catch (error) {

       await this.showToast('Error al procesar la solicitud', 'danger');
    } finally {
        this.isProcessing.set(false);
    }
  }

  // Entregar tarea para revisión (Voluntario)
  async submitTask(): Promise<void> {
    // Verificamos si la nota está vacía o solo tiene espacios
    if (!this.proofNote || this.proofNote.trim() === '') {
      await this.showAlert(
        'Falta información', 
        'Por favor, escribe una breve nota de entrega antes de enviar a revisión.'
      );
      return; // Detiene la ejecución para que no se envíe
    }
    try {

      if (this.proofUrl.trim()) {
        const isValidUrl = /^https:\/\/.+/.test(this.proofUrl.trim());
        if (!isValidUrl) {
          await this.showToast('El enlace de evidencia debe ser una URL válida (https://...)', 'danger');
          return;
        }
    }
      await this.orchestrator.submitTaskDelivery(
        this.task.uid,
        this.proofNote,
        this.proofUrl
      );
      
      await this.showToast('Tarea enviada a revisión con éxito', 'success');
      this.modalCtrl.dismiss(this.task.uid, 'submitted');

    } catch (error) {
        await this.showToast('Error al entregar la tarea', 'danger');
    } finally {
        this.isProcessing.set(false);
    }
  }

  // Aprobar tarea y dar puntos (Organización)
  async approveTask(): Promise<void> {
    this.isProcessing.set(true);
    try {
        const volunteerId = this.task.assignedVolunteerId || (this.task as any).assignedVolunteer?.uid;
        await this.orchestrator.approveTaskCompletion(this.task.uid, volunteerId, this.feedbackNote);
        await this.showToast('¡Tarea aprobada con éxito!', 'success');
        this.modalCtrl.dismiss(this.task.uid, 'approved');
    } catch (error) {
       
        await this.showToast('Error al aprobar la tarea', 'danger');
    } finally {
        this.isProcessing.set(false);
    }
  }

  // Solicitar corrección / rechazar entrega (Organización)
 async rejectTask(): Promise<void> {
    this.isProcessing.set(true);
    try {
      await this.orchestrator.rejectTaskDelivery(
        this.task.uid, 
        this.rejectFeedback || 'Se requiere corrección en la entrega.'
      );
      await this.showToast('Se ha solicitado una corrección', 'warning');
      this.modalCtrl.dismiss(this.task.uid, 'rejected');
    } catch (error) {

      await this.showToast('Error al procesar la solicitud', 'danger');
    } finally {
      this.isProcessing.set(false);
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
      mode: 'ios'
    });
    await toast.present();
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['Entendido'],
      cssClass: 'cozy-alert' 
    });
    await alert.present();
  }
}