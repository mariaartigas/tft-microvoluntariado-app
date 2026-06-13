import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { HomeComponent } from './features/home/home.component';
import { ProfileComponent } from './features/profile/profile.component';

import { authGuard, guestGuard } from './core/guards/auth.guard';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard]},
  { path: 'dashboard', component: HomeComponent, canActivate: [authGuard]},
  {
  path: 'profile',
  component: ProfileComponent,
  canActivate: [authGuard]
}
];