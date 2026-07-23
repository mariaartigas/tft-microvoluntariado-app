import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { HomeComponent } from './features/home/home.component';
import { RegisterOrganizationComponent } from './features/register-organization/register-organization.component';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { AboutPageComponent } from './shared/components/about/about.page';


export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard]},
  { path: 'logout', component: LoginComponent, canActivate: [authGuard]},
  { path: 'home', component: HomeComponent},
  { path: 'register-organization', component: RegisterOrganizationComponent, canActivate: [guestGuard]},
  { path: 'organizations', loadComponent: () => import('./features/organizations-list/organizations-list.component').then(m => m.OrganizationsListComponent) },
  { path: 'organization/:slug', loadComponent: () => import('./features/profile-dashboard/profile-dashboard.component').then(m => m.ProfileDashboardPageComponent) },
  { path: 'user/:username', loadComponent: () => import('./features/profile-dashboard/profile-dashboard.component').then(m => m.ProfileDashboardPageComponent) },
  { path: 'organization/:slug/tasks', loadComponent: () => import('./features/tasks/tasks-list/tasks-list.component').then(m => m.TasksListComponent), data: { mode: 'org' }},
  { path: 'user/:username/tasks', loadComponent: () => import('./features/tasks/tasks-list/tasks-list.component').then(m => m.TasksListComponent), data: { mode: 'volunteer' }, canActivate: [authGuard]},
  { path: 'about',component: AboutPageComponent}
];