import { Routes } from '@angular/router';
import { CORE_ROUTES } from './core/core.routes';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../app/core/layout/layout').then((c) => c.Layout),
    children: CORE_ROUTES,
  },
];
