//Angular
import { Routes } from '@angular/router';

export const ESTATISTICAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../components/estatisticas-page/estatisticas-page').then((c) => c.EstatisticasPage),
  },
];
