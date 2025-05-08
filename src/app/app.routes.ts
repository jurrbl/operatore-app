import { Routes } from '@angular/router';
import { AuthGuard } from '../auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('../auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('../auth/ForgotPassword/ForgotPassword.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('../auth/ResetPassword/ResetPassword.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: 'home',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./operatore/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'mappa',
        loadComponent: () =>
          import('./operatore/mappa/mappa.component').then(
            (m) => m.MappaComponent
          ),
      },
      {
        path: 'perizie',
        loadComponent: () =>
          import('./operatore/perizie/perizie.component').then(
            (m) => m.PerizieComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
