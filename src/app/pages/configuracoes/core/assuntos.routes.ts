//Angular
import { Routes } from '@angular/router';

export const CONFIGURACOES_ROUTES: Routes = [
  {
    path: 'backup-restauracao',
    loadComponent: () =>
      import('../components/backup-restauracao/backup-restauracao').then(
        (c) => c.BackupRestauracao,
      ),
  },
];
