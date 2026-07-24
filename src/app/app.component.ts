import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonRouterOutlet, IonMenu, IonContent, IonList, IonHeader, IonLabel, IonMenuToggle, IonToolbar } from '@ionic/angular/standalone';
import { HeaderComponent } from "./shared/components/header/header.component";
import { SideMenuComponent } from "./shared/components/side-menu/side-menu.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    IonRouterOutlet,
    IonMenu, HeaderComponent, RouterLink,
    RouterLinkActive,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonLabel,
    IonMenuToggle,
    IonRouterOutlet,
    IonContent,
    IonList,
    IonApp,
    SideMenuComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'projectv0';
overlay: any;
}
