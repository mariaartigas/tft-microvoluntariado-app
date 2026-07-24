
import { AuthService } from '../../core/services/auth.service';
import { IonInput, IonButton, IonContent, IonIcon, IonSpinner, ToastController } from "@ionic/angular/standalone";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule  } from '@angular/forms';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OrganizationService } from '../../core/services/organization.service';
import { UserService } from '../../core/services/user.service';
import { FooterComponent } from "../../shared/components/footer/footer.component";
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  imports: [RouterLink, IonInput, IonButton, ReactiveFormsModule, IonContent, IonIcon, IonSpinner, FooterComponent],
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
     const { orgName, orgEmail } = this.registerForm.getRawValue();
    try {
    this.isLoading.set(true);
    const firebaseUser = await this.authService.loginWithGoogle();

    if (!firebaseUser) {
      this.isLoading.set(false);
      return;
    }
    const userProfile = await firstValueFrom(this.userService.ensureUserProfile$(firebaseUser));
    
    if (!userProfile) {
      throw new Error('USER_PROFILE_FAILED');
    }
  
    const ownerData = {
      uid: userProfile.uid, 
      displayName: userProfile.displayName || '', 
      email: userProfile.email || ''
    };

    const org = await this.orgService.ensureOrganization(orgName, orgEmail, ownerData);

    await this.userService.update(userProfile.uid, {
      organizationId: org.uid,
      role: 'organization', 
      organizationSlug: org.slug
    });

    await this.router.navigate(['/organization', org.slug]);

  } catch (e: any) {

    if (e.message === 'ORGANIZATION_EXISTS') {
      const message = 'Ya existe una organización registrada con ese nombre.';
      this.errorMessage.set(message);
      await this.showToast(message, 'danger'); 
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

