//Externos
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { providePrimeNG } from 'primeng/config';

//Aplicação
import { primeNgTranslation } from '../../../i18n/primeng-pt';

/**
 * Preset alinhado à identidade visual do projeto (gradiente vermelho→laranja
 * de $gradientStartColor/$gradientMidColor/$gradientLastColor em
 * assets/scss/utils/_variables.scss). A escala abaixo é ancorada em
 * $gradientStartColor (#E11F47), a cor dominante do gradiente.
 */
const QuestoesConcursoPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#fef1f4',
      100: '#fcdee4',
      200: '#f8b9c6',
      300: '#f3869d',
      400: '#ed4568',
      500: '#e11f47',
      600: '#be193b',
      700: '#92122c',
      800: '#660c1e',
      900: '#380610',
      950: '#1c0308',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        highlight: {
          background: '{primary.500}',
          focusBackground: '{primary.600}',
          color: '#ffffff',
          focusColor: '#ffffff',
        },
      },
      dark: {
        primary: {
          color: '{primary.400}',
          contrastColor: '{primary.950}',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
          color: '{primary.400}',
          focusColor: '{primary.400}',
        },
      },
    },
  },
});

export const PRIMENG_PROVIDER = providePrimeNG({
  theme: {
    preset: QuestoesConcursoPreset,
    options: {
      prefix: 'p',
      darkModeSelector: '.app-dark',
      cssLayer: false,
    },
  },
  ripple: false,
  translation: primeNgTranslation,
  zIndex: {
    modal: 1100, // dialog, sidebarc
    overlay: 900, // dropdown, overlaypanel
    menu: 1000, // overlay menus
    tooltip: 1100, // tooltip
  },
});
