//Angular
import { Routes } from '@angular/router';

export const BANCAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../components/bancas-list-page/bancas-list-page').then((c) => c.BancasListPage),
  },
  {
    path: 'cadastro',
    loadComponent: () =>
      import('../components/bancas-form-page/bancas-form-page').then((c) => c.BancasFormPage),
  },
  {
    path: 'edicao/:id',
    loadComponent: () =>
      import('../components/bancas-form-page/bancas-form-page').then((c) => c.BancasFormPage),
  },
  {
    path: 'visualizacao/:id',
    loadComponent: () =>
      import('../components/bancas-form-page/bancas-form-page').then((c) => c.BancasFormPage),
  },
];
