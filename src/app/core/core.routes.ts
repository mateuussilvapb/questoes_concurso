//Angular
import { Routes } from '@angular/router';

//Aplicação
import { DASHBOARD_ROUTES } from '../pages/dashboard/core/dashboard.routes';

export const CORE_ROUTES: Routes = [
  {
    path: '',
    children: DASHBOARD_ROUTES,
    // loadChildren: () =>
    //   import('../pages/dashboard/core/dashboard.routes').then((c) => c.DASHBOARD_ROUTES),
  },
];
