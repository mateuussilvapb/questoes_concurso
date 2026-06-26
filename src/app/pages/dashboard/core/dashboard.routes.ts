//Angular
import { Routes } from '@angular/router';

//Aplicação

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/dashboard-page/dashboard-page').then((c) => c.DashboardPage),
  }
];
