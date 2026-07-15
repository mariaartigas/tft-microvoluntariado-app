import { Component } from '@angular/core';
import { IonFooter, IonToolbar, IonTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [IonFooter, IonToolbar, IonTitle],
  template: `
    <ion-footer>
      <ion-toolbar color="light">
        <ion-title class="ion-text-center" size="small">
          © 2026 
        </ion-title>
      </ion-toolbar>
    </ion-footer>
  `,
  styleUrls: ['./footer.component.scss'],
})

export class FooterComponent {
}
