import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { UserService } from '../../../../core/services/user.service';
import { OrganizationService } from '../../../../core/services/organization.service';
import { ProfileState } from '../../profile-dashboard.component'; // Ajusta la ruta a tu interface

@Component({
  selector: 'app-edit-profile-modal',
  templateUrl: './edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class EditProfileModalComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private userService = inject(UserService);
  private orgService = inject(OrganizationService);

  @Input({ required: true }) profileData!: ProfileState;
  @Input({ required: true }) isOrgMode!: boolean;

  isSaving = signal<boolean>(false);

  // Formulario local (ViewModel del Modal)
  displayName = '';
  description = '';
  logoURL = '';

  ngOnInit() {
    if (this.profileData) {
      this.displayName = this.profileData.displayName || '';
      this.description = this.profileData.description || '';
      this.logoURL = this.profileData.logoURL || '';
    }
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async save() {
    if (!this.profileData?.uid) return;

    this.isSaving.set(true);

    try {
      if (this.isOrgMode) {
        const updatedOrg = {
          displayName: this.displayName.trim(),
          description: this.description.trim(),
          logoURL: this.logoURL.trim() || null
        };
        await this.orgService.update(this.profileData.uid, updatedOrg);
      } else {
        const updatedUser = {
          displayName: this.displayName.trim(),
          bio: this.description.trim(),
          photoURL: this.logoURL.trim() || null
        };
        await this.userService.update(this.profileData.uid, updatedUser);
      }

      await this.showToast('Perfil actualizado con éxito', 'success');
      this.modalCtrl.dismiss(true, 'confirm'); // Retornamos true para confirmar refresco
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
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