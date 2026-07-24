import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { RouterLink } from '@angular/router';
import { IonicModule } from "@ionic/angular";
@Component({
  selector: 'app-side-menu',
  standalone: true,
  templateUrl: './side-menu.component.html',
  imports: [
    RouterLink,
    IonicModule
],
  styleUrls: ['./side-menu.component.scss'],
})
export class SideMenuComponent{

  private authService = inject(AuthService);

  userProfile = this.authService.currentUserProfile;

  get isOrganization(): boolean {
    return this.currentUser?.role === 'organization';
  }

  private get currentUser(): any {
    return this.userProfile();
  }

  //ir a las tareas

 get tasksLink(): string[] {
    const identifier = this.currentUser?.email?.split('@')[0];

    if (identifier) {
    return ['/user', identifier, 'tasks'];
    }
    
    return ['/login'];
  }

  //perfil

  get profileLink(): string[] {
      const identifier = this.currentUser?.email?.split('@')[0];

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

  //vista organizaciones

  get organizationProfileLink(): string[] {
    if (!this.currentUser || this.currentUser.role !== 'organization') return ['/login'];
    return ['/organization', this.currentUser.organizationSlug ];
  }

  get organizationTasksLink(): string[] {
    if (!this.currentUser || this.currentUser.role !== 'organization') return ['/login'];
    return ['/organization', this.currentUser.organizationSlug , 'tasks'];
  }

}
