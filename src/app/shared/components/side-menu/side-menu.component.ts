import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonicModule } from "@ionic/angular";
@Component({
  selector: 'app-side-menu',
  standalone: true,
  templateUrl: './side-menu.component.html',
  imports: [ 
    RouterLink, AsyncPipe,

    IonicModule
],
  styleUrls: ['./side-menu.component.scss'],
})
export class SideMenuComponent{

  private authService = inject(AuthService);

  user = this.authService.currentUser;

}
