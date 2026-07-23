import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {  IonHeader,  IonToolbar,  IonButtons,  IonMenuButton,  IonIcon } from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonIcon
  ]
})
export class HeaderComponent {
  readonly authService = inject(AuthService);

  readonly profileRoute = computed(() => {
    const profile = this.authService.currentUserProfile() as any;

    if (profile?.slug) {
      return ['/organization', profile.slug];
    }

    if (profile?.username) {
      return ['/user', profile.username];
    }
    return ['/login'];
  });

  logout(): void {
    this.authService.logout();
  }
}