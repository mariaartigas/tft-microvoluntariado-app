import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { HomeComponent } from './features/home/home.component';
import { RegisterOrganizationComponent } from './features/register-organization/register-organization.component';
import { authGuard, guestGuard } from './core/guards/auth.guard';


export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard]},
  { path: 'home', component: HomeComponent}, //no proteger con authguard porque quiero poder acceder siempre
  { path: 'register-organization', component: RegisterOrganizationComponent}, //no tiene authguard? lo ponemos el guest? VALORAR
  //{ path: 'dashboard', component: ProfileDashboardPageComponent}, //ACTUALIZAR CUANDO SEA NECESARIO
  { path: 'organization/:slug', loadComponent: () => import('./features/profile-dashboard/profile-dashboard.component').then(m => m.ProfileDashboardPageComponent) },
  { path: 'user/:slug', loadComponent: () => import('./features/profile-dashboard/profile-dashboard.component').then(m => m.ProfileDashboardPageComponent) },
  { path: 'task/:id', loadComponent: () => import('./features/tasks/task-detail/task-detail.component').then(m => m.TaskDetailComponent) }



];