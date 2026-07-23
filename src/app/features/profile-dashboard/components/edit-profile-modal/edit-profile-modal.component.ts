import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonItem, IonInput, IonTextarea, IonSpinner, ModalController, ToastController, IonCard, IonCardContent } from '@ionic/angular/standalone';
import { UserService } from '../../../../core/services/user.service';
import { OrganizationService } from '../../../../core/services/organization.service';
import { ProfileState } from '../../profile-dashboard.component';

@Component({
  selector: 'app-edit-profile-modal',
  templateUrl: './edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.scss'],
  standalone: true,
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonItem, IonInput, IonTextarea, IonSpinner, IonCard, IonCardContent]
})

export class EditProfileModalComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private userService = inject(UserService);
  private orgService = inject(OrganizationService);

  // inputs
  @Input({ required: true }) profileData!: ProfileState;
  @Input() isOrgMode: boolean = false;

  // Estado del formulario con Signals
  readonly isSaving = signal<boolean>(false);
  displayName = '';
  description = '';

  ngOnInit() {
    if (this.profileData) {
      this.displayName = this.profileData.displayName || '';
      this.description = this.profileData.description || '';
    }
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async save() {
    const uid = this.profileData?.uid;
    const cleanName = this.displayName.trim().slice(0, 80);
    const cleanDescription = this.description.trim().slice(0, 500);

    if (!uid || !cleanName) return;

    this.isSaving.set(true);

    try {
      if (this.isOrgMode) {
        await this.orgService.update(uid, {
          displayName: cleanName,
          description: cleanDescription
        });
      } else {
        await this.userService.update(uid, {
          displayName: cleanName,
          bio: cleanDescription
        });
      }

        await this.showToast('Perfil actualizado con éxito', 'success');
        this.modalCtrl.dismiss(true, 'confirm');
    } catch (error) {
        await this.showToast('Error al guardar los cambios', 'danger');
    } finally {
        this.isSaving.set(false);
    }
  }

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