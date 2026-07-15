import { Component, inject, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonButton } from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonButton, RouterLink],
  //templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  template: `
<ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ title }}</ion-title>

        <ion-buttons slot="end">
          @if (currentUser()) {
            <ion-button routerLink="/profile">
              <p>Logeado</p>
            </ion-button>
          } @else {
            <ion-button routerLink="/login">
              <p>Sin logear</p>
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `
})

export class HeaderComponent {
 @Input() title: string = 'HOME'; // Permite cambiar el título desde fuera
  
  private authService = inject(AuthService);
  currentUser = this.authService.currentUser;

}
