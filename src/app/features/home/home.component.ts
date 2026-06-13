import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { AsyncPipe } from '@angular/common';
import { SideMenuComponent } from "../../shared/components/side-menu/side-menu.component";
import { IonMenuButton, IonHeader, IonButtons, IonToolbar, IonContent, IonTitle, IonAvatar } from "@ionic/angular/standalone";

@Component({
  imports: [AsyncPipe, SideMenuComponent, IonMenuButton, IonHeader, IonButtons, IonToolbar, IonContent, IonTitle, IonAvatar],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  auth = inject(AuthService); // hacer referencia a authservice
  public user$ = this.auth.user$;

  onImageError(event: Event) {
  console.log('Error cargando imagen', event);
}

}