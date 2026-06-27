//Angular
import { Routes } from '@angular/router';

export const ASSUNTOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../components/assuntos-list-page/assuntos-list-page').then((c) => c.AssuntosListPage),
  },
  {
    path: 'cadastro',
    loadComponent: () =>
      import('../components/assuntos-form-page/assuntos-form-page').then((c) => c.AssuntosFormPage),
  },
  {
    path: 'edicao/:id',
    loadComponent: () =>
      import('../components/assuntos-form-page/assuntos-form-page').then((c) => c.AssuntosFormPage),
  },
  {
    path: 'visualizacao/:id',
    loadComponent: () =>
      import('../components/assuntos-form-page/assuntos-form-page').then((c) => c.AssuntosFormPage),
  },
];
