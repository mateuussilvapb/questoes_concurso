//Externos
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { providePrimeNG } from 'primeng/config';

//Aplicação
import { primeNgTranslation } from '../../../i18n/primeng-pt';

/**
 * Preset alinhado à identidade visual do projeto (gradiente índigo→violeta→fúcsia
 * de $gradientStartColor/$gradientMidColor/$gradientLastColor em
 * assets/scss/utils/_variables.scss). A escala abaixo é a escala Índigo (Tailwind),
 * usada como matiz único para os componentes padrão do PrimeNG.
 */
const QuestoesConcursoPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.600}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.700}',
          activeColor: '{primary.800}',
        },
        highlight: {
          background: '{primary.600}',
          focusBackground: '{primary.700}',
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
