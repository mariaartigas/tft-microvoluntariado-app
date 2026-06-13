import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonApp, IonRouterOutlet, IonMenu, IonContent, IonList, IonItem } from '@ionic/angular/standalone';
import { SideMenuComponent } from "./shared/components/side-menu/side-menu.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,
    IonApp,
    IonRouterOutlet,
    IonMenu,
    IonContent,
    IonList,
    IonItem, SideMenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'projectv0';
overlay: any;
}
