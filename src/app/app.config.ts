import { ApplicationConfig } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { LoginComponent } from '../auth/login/login.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: 'login' } // Reindirizza le pagine inesistenti al login
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes) // Registra le rotte nell'app
  ]
};
