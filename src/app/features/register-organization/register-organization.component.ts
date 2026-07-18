
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SideMenuComponent } from "../../shared/components/side-menu/side-menu.component";
import { IonInput, IonButton, IonContent, IonIcon, IonSpinner } from "@ionic/angular/standalone";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule  } from '@angular/forms';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { async } from 'rxjs';

@Component({
  standalone: true,
  imports: [RouterLink, AsyncPipe, SideMenuComponent, IonInput, IonButton, ReactiveFormsModule, IonContent, IonIcon, IonSpinner],
  selector: 'app-register',
  templateUrl: './register-organization.component.html',
  styleUrls: ['./register.component.scss'],
})

export class RegisterOrganizationComponent {

  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  isLoading = signal<boolean>(false); 
  errorMessage = signal<string | null>(null); //si se traba el popup etc entonces se lanza esto
  
  registerForm: FormGroup = this.fb.group({
    orgName: ['', [Validators.required, Validators.minLength(3)]],
    orgEmail: ['', [Validators.required, Validators.email]]
  });

  async registerWithGoogle() {

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const orgName = this.registerForm.value.orgName.trim();
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      // llamamos al método que realmente hace el registro
      await this.auth.registerOwnerAndOrganizationWithGoogle(orgName);
      
      // REVISAR redirección
      this.router.navigate(['/organization/dashboard']);
    } catch (e: any) {
      console.error('Error durante el registro de la organización:', e);
      
      // Mensajes de error 
      if (e.code === 'auth/popup-closed-by-user') {
        this.errorMessage.set('El inicio de sesión con Google fue cancelado.');
      } else {
        this.errorMessage.set('No se pudo completar el registro. Inténtalo de nuevo.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}

