import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { AsyncPipe } from '@angular/common';
import { SideMenuComponent } from "../../shared/components/side-menu/side-menu.component";
import { IonMenuButton, IonHeader, IonButtons, IonToolbar, IonContent, IonTitle, IonAvatar, IonButton } from "@ionic/angular/standalone";
import { RouterLink } from '@angular/router';
import { HeaderComponent } from "../../shared/components/header/header.component";
import { FooterComponent } from "../../shared/components/footer/footer.component";

@Component({
  selector: 'app-home',
  standalone : true, //para que servía esto?
  imports: [SideMenuComponent, IonMenuButton, IonHeader, IonButtons, IonToolbar, IonContent, IonTitle, IonAvatar, IonButton, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent {
  authService = inject(AuthService); 

  currentUser = this.authService.currentUser;        //firebase
  userProfile = this.authService.currentUserProfile; //información

  //error en cargas de imágenes
  onImageError(event: Event) {
    console.log('Error cargando imagen', event);
  }

  //función temporal durante debugging para poder visualizar la imagen de google sin bloqueos en el navegador-----------
  getSafeImageUrl(url: string | null | undefined): string {
    if (!url) return 'https://ionicframework.com/docs/img/demos/avatar.svg';

    if (url.includes('google')) {
      return `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(url)}`;
  }

    return url;
  }

  getInitials(name: string | null | undefined): string {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

}