import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { 
  IonGrid, 
  IonRow, 
  IonCol, 
  IonIcon 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    IonGrid, 
    IonRow, 
    IonCol, 
    IonIcon
  ]
})
export class FooterComponent {
  constructor() {}
}