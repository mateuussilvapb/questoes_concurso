//Angular
import { Routes } from '@angular/router';

export const QUESTAO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../components/questao-list-page/questao-list-page').then((c) => c.QuestaoListPage),
  },
  {
    path: 'cadastro',
    loadComponent: () =>
      import('../components/questao-form-page/questao-form-page').then((c) => c.QuestaoFormPage),
  },
  {
    path: 'edicao/:id',
    loadComponent: () =>
      import('../components/questao-form-page/questao-form-page').then((c) => c.QuestaoFormPage),
  }
];
