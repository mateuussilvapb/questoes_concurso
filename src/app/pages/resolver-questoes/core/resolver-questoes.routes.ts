//Angular
import { Routes } from '@angular/router';

export const RESOLVER_QUESTOES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../components/resolver-questoes-page/resolver-questoes-page').then(
        (c) => c.ResolverQuestoesPage,
      ),
  },
];
