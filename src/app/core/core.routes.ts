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
  {
    path: 'questao',
    loadChildren: () =>
      import('../pages/questoes/core/questoes.routes').then((c) => c.QUESTAO_ROUTES),
  },
  {
    path: 'resolver-questoes',
    loadChildren: () =>
      import('../pages/resolver-questoes/core/resolver-questoes.routes').then(
        (c) => c.RESOLVER_QUESTOES_ROUTES,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('../../app/pages/page-not-found/components/page-not-found/page-not-found').then(
        (c) => c.PageNotFound,
      ),
  },
];
