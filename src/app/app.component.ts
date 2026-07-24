import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet} from '@ionic/angular/standalone';
import { HeaderComponent } from "./shared/components/header/header.component";
import { SideMenuComponent } from "./shared/components/side-menu/side-menu.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    IonRouterOutlet,
    HeaderComponent,
    IonRouterOutlet,
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
