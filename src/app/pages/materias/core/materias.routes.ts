//Angular
import { Routes } from '@angular/router';

export const MATERIAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../components/materias-list-page/materias-list-page').then((c) => c.MateriasListPage),
  },
  {
    path: 'cadastro',
    loadComponent: () =>
      import('../components/materias-form-page/materias-form-page').then((c) => c.MateriasFormPage),
  },
  {
    path: 'edicao/:id',
    loadComponent: () =>
      import('../components/materias-form-page/materias-form-page').then((c) => c.MateriasFormPage),
  },
  {
    path: 'visualizacao/:id',
    loadComponent: () =>
      import('../components/materias-form-page/materias-form-page').then((c) => c.MateriasFormPage),
  },
];
