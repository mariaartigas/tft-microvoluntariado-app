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

  //ir a las tareas

 get tasksLink(): string[] {
  const currentUser = this.user() as any; 

    const identifier = currentUser.email?.split('@')[0];

    if (identifier) {
    return ['/user', identifier, 'tasks'];
    }
    
    return ['/login'];
  }

  //perfil

  get profileLink(): string[] {
      const currentUser = this.user() as any; 

      const identifier = currentUser.email?.split('@')[0];

      if (identifier) {
      return ['/user', identifier];
      }
      
      return ['/login'];
    }



//cerrar sesión

logout() {
  (document.activeElement as HTMLElement)?.blur();
  this.authService.logout();
}

}
