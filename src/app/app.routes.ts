import { Routes } from '@angular/router';
import { CORE_ROUTES } from './core/core.routes';

export const routes: Routes = [
  {
    // Fora do Layout (sem menu/sidebar): precisa ser acessível como página pública,
    // já que a URL é cadastrada na tela de consentimento OAuth do Google Cloud Console.
    path: 'privacidade',
    loadComponent: () =>
      import('./pages/privacidade/components/politica-privacidade/politica-privacidade').then(
        (c) => c.PoliticaPrivacidade,
      ),
  },
  {
    path: '',
    loadComponent: () => import('../app/core/layout/layout').then((c) => c.Layout),
    children: CORE_ROUTES,
  }
];
