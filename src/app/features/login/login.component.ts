import { Component,inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SideMenuComponent } from "../../shared/components/side-menu/side-menu.component";
import { Router, RouterLink } from '@angular/router';
import { IonInput, IonButton, IonContent, IonCheckbox } from "@ionic/angular/standalone";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule  } from '@angular/forms';
import { FooterComponent } from "../../shared/components/footer/footer.component";

@Component({
  standalone: true,
  imports: [RouterLink, AsyncPipe, SideMenuComponent, IonCheckbox, IonInput, IonButton, ReactiveFormsModule, IonContent, IonCheckbox, FooterComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  private router = inject(Router);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

 //funcionalidad no activada ! solo visual
  logInForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  public user$ = this.auth.currentUser;

  async loginWithGoogle() {
    const userProfile = await this.auth.loginWithGoogle();
    if (userProfile?.username) {
      await this.router.navigate(['/user', userProfile.username]);
    }
  }

  logout() {
    this.auth.logout();
  }
}