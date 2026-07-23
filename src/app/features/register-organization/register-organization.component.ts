
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SideMenuComponent } from "../../shared/components/side-menu/side-menu.component";
import { IonInput, IonButton, IonContent, IonIcon, IonSpinner, ToastController } from "@ionic/angular/standalone";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule  } from '@angular/forms';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Router, RouterLink } from '@angular/router';

import { OrganizationService } from '../../core/services/organization.service';
import { UserService } from '../../core/services/user.service';
import { FooterComponent } from "../../shared/components/footer/footer.component";

@Component({
  standalone: true,
  imports: [RouterLink, AsyncPipe, SideMenuComponent, IonInput, IonButton, ReactiveFormsModule, IonContent, IonIcon, IonSpinner, FooterComponent],
  selector: 'app-register',
  templateUrl: './register-organization.component.html',
  styleUrls: ['./register-organization.component.scss'],
})

export class RegisterOrganizationComponent {

  private  fb = inject(FormBuilder);
  private  router = inject(Router);
  private  authService = inject(AuthService);
  private  orgService = inject(OrganizationService);
  private  userService = inject(UserService);
  private  toastCtrl = inject(ToastController);

  readonly registerForm: FormGroup = this.fb.group({ 
    orgName: ['', [Validators.required, Validators.minLength(3)]],
    orgEmail: ['', [Validators.required, Validators.email]]
  });
  
   readonly isLoading = signal<boolean>(false); 
   readonly errorMessage = signal<string | null>(null); //si se traba el popup etc entonces se lanza esto

  //FUNCIÓN
  async registerWithGoogle() {

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const { orgName, orgEmail } = this.registerForm.getRawValue();

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const userProfile = await this.authService.loginWithGoogle();
      if (!userProfile) {
        this.isLoading.set(false);
        return;
      }

      //construimos los datos del usuario a pasar a la organización
      const ownerData = {uid: userProfile.uid, displayName: userProfile.displayName || '', email: userProfile.email || ''};

      // crear la org  de forma AISLADA CON SU SERVICIO
     const org = await this.orgService.ensureOrganization(orgName, orgEmail, ownerData);
      // vinculamos con el usuario IMPORTANT
      // Como userProfile ya vino listo del login, usamos su UID directamente
      await this.userService.update(userProfile.uid, {organizationId: org.uid,role: 'organization'});

      // redirección ...
      await this.router.navigate(['/organization', org.slug]);

    } catch (e: any) {

        if (e.message === 'ORGANIZATION_EXISTS') {
          const message = 'Ya existe una organización registrada con ese nombre.';
          this.errorMessage.set(message);
          await this.showToast(message, 'danger'); // Toast rojo de alerta
      } else {
          const genericMessage = 'No se pudo completar el registro. Inténtalo de nuevo.';
          this.errorMessage.set(genericMessage);
          await this.showToast(genericMessage, 'danger');
      }

    } finally {
      this.isLoading.set(false);
    }
  }


  private async showToast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3500,
      position: 'bottom',
      color,
      mode: 'ios'
    });
    await toast.present();
  }
}

