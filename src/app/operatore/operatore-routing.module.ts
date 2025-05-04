import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MappaComponent } from './mappa/mappa.component';
import { PerizieComponent } from './perizie/perizie.component';

export const operatoreRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'mappa', component: MappaComponent },
  { path: 'perizie', component: PerizieComponent }
];
