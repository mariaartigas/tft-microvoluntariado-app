import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { AsyncPipe } from '@angular/common';
import { SideMenuComponent } from "../../shared/components/side-menu/side-menu.component";
import { IonMenuButton, IonHeader, IonButtons, IonToolbar, IonContent, IonTitle, IonAvatar, IonButton } from "@ionic/angular/standalone";
import { RouterLink } from '@angular/router';
@Component({
  standalone : true, //para que servía esto?
  imports: [AsyncPipe, SideMenuComponent, IonMenuButton, IonHeader, IonButtons, IonToolbar, IonContent, IonTitle, IonAvatar, IonButton, RouterLink],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  auth = inject(AuthService); 
  public user$ = this.auth.user$;

  onImageError(event: Event) {
  console.log('Error cargando imagen', event);
}

}