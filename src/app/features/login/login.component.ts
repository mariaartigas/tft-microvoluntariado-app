import { Component,inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SideMenuComponent } from "../../shared/components/side-menu/side-menu.component";
import { RouterLink } from '@angular/router';
import { IonInput, IonButton, IonContent, IonCheckbox } from "@ionic/angular/standalone";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule  } from '@angular/forms';

@Component({
  standalone: true,
  imports: [AsyncPipe, SideMenuComponent, IonCheckbox, IonInput, IonButton, ReactiveFormsModule, IonContent, IonCheckbox],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  logInForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });


  public user$ = this.auth.user$;
  login() {
    console.log('BOTÓN LOGIN FUNCIONA');

    //en proceso
  }

  loginWithGoogle() {
    this.auth.loginWithGoogle();
  }

  logout() {
    this.auth.logout();
  }
}