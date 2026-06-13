import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { IonMenu, IonContent, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-side-menu',
  standalone: true,
  templateUrl: './side-menu.component.html',
  imports: [
    IonMenu,
    IonContent,
    IonList,
    IonItem,
    AsyncPipe,
    RouterLink,
    IonLabel
],
  styleUrls: ['./side-menu.component.scss'],
})
export class SideMenuComponent{

  auth = inject(AuthService);

  constructor() { }

  ngOnInit() {}

}
