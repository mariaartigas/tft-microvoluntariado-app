import { Component,inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SideMenuComponent } from "../../shared/components/side-menu/side-menu.component";

@Component({
  standalone: true,
  imports: [AsyncPipe, SideMenuComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent {

  auth = inject(AuthService);

  public user$ = this.auth.user$;
  login() {
    console.log('BOTÓN LOGIN FUNCIONA');

    this.auth.loginWithGoogle();
  }
  logout() {
    this.auth.logout();
  }
}