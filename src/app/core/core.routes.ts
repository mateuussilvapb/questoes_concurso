//Angular
import { Routes } from '@angular/router';

export const CORE_ROUTES: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('../pages/dashboard/core/dashboard.routes').then((c) => c.DASHBOARD_ROUTES),
  },
  {
    path: 'materia',
    loadChildren: () =>
      import('../pages/materias/core/materias.routes').then((c) => c.MATERIAS_ROUTES),
  },
  {
    path: 'assunto',
    loadChildren: () =>
      import('../pages/assuntos/core/assuntos.routes').then((c) => c.ASSUNTOS_ROUTES),
  },
];
