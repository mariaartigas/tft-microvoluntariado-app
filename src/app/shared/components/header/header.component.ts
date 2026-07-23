import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonButtons, 
  IonMenuButton, 
  IonIcon 
} from '@ionic/angular/standalone';

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
  constructor() {}
}