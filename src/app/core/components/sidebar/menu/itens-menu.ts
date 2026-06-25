//Externos
import { PrimeIcons } from 'primeng/api';

export interface ItemMenu {
  label: string;
  separator: boolean;
  route?: string;
  icon?: string;
  children?: ItemMenu[];
}

export const ItensMenu: ItemMenu[] = [
  {
    label: 'HOME',
    separator: true,
    children: [
      {
        label: 'Dashboard',
        separator: false,
        icon: PrimeIcons.OBJECTS_COLUMN,
        route: '/',
      },
    ],
  },
  {
    label: 'QUESTÕES',
    separator: true,
    children: [
      {
        label: 'Gerenciar Questões',
        separator: false,
        icon: PrimeIcons.QUESTION_CIRCLE,
        route: '/questao',
      },
      {
        label: 'Resolver Questões',
        separator: false,
        icon: PrimeIcons.PLAY_CIRCLE,
        route: '/questao/resolver',
      },
    ],
  },
  {
    label: 'MATÉRIAS',
    separator: true,
    children: [
      {
        label: 'Gerenciar Matérias',
        separator: false,
        icon: PrimeIcons.BOOK,
        route: '/materia',
      },
    ],
  },
  {
    label: 'ASSUNTOS',
    separator: true,
    children: [
      {
        label: 'Gerenciar Assuntos',
        separator: false,
        icon: PrimeIcons.TAG,
        route: '/assunto',
      },
    ],
  },
  {
    label: 'ESTATÍSTICAS',
    separator: true,
    children: [
      {
        label: 'Acompanhar Estatísticas',
        separator: false,
        icon: PrimeIcons.CHART_BAR,
        route: '/estatistica',
      },
    ],
  },
  {
    label: 'CONFIGURAÇÕES',
    separator: true,
    children: [
      {
        label: 'Backup e Restauração',
        separator: false,
        icon: PrimeIcons.DATABASE,
        route: '/configuracoes/backup-restauracao',
      },
    ],
  },
];
