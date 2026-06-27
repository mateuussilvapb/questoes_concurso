//Externos
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';

//Aplicação
import { primeNgTranslation } from '../../../i18n/primeng-pt';

export const PRIMENG_PROVIDER = providePrimeNG({
  theme: {
    preset: Aura,
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


//TODO: Avaliar se é necessário criar um preset customizado para o tema Aura, com cores personalizadas para a aplicação.
// const MyPreset = definePreset(Aura, {
//   primitive: {
//     red: {
//       50: '#fef2f7',
//       100: '#fde6ef',
//       200: '#fccce0',
//       300: '#fab3d0',
//       400: '#d20d68',
//       500: '#d20d68',
//       600: '#d20d68',
//       700: '#b00b5a',
//       800: '#8e094c',
//       900: '#6c073d',
//       950: '#4a052f',
//     },
//   },
//   semantic: {
//     primary: {
//       50: '#f0f7ff',
//       100: '#d3ddfe',
//       200: '#99b4fe',
//       300: '#4f8dfd',
//       400: '#0d68d4',
//       500: '#064794',
//       600: '#022859',
//       700: '#00102b',
//       800: '#000818',
//       900: '#000408',
//       950: '#000204',
//     },
//     colorScheme: {
//       light: {
//         primary: {
//           color: '#0d68d4',
//           contrastColor: '#ffffff',
//           hoverColor: '#064794',
//           activeColor: '#022859',
//         },
//         highlight: {
//           background: '#0d68d4',
//           focusBackground: '#064794',
//           color: '#ffffff',
//           focusColor: '#ffffff',
//         },
//         surface: {
//           0: '#ffffff',
//           50: '{gray.50}',
//           100: '{gray.100}',
//           200: '{gray.200}',
//           300: '{gray.300}',
//           400: '{gray.400}',
//           500: '{gray.500}',
//           600: '{gray.600}',
//           700: '{gray.700}',
//           800: '{gray.800}',
//           900: '{gray.900}',
//           950: '{gray.950}',
//         },
//       },
//       dark: {
//         primary: {
//           color: '#fd4d8c',
//           contrastColor: '#ffffff',
//           hoverColor: '#fd99b4',
//           activeColor: '#fed3dd',
//         },
//         highlight: {
//           background: '#fd4d8c',
//           focusBackground: '#fd99b4',
//           color: '#ffffff',
//           focusColor: '#ffffff',
//         },
//         surface: {
//           0: '#ffffff',
//           50: '{zinc.50}',
//           100: '{zinc.100}',
//           200: '{zinc.200}',
//           300: '{zinc.300}',
//           400: '{zinc.400}',
//           500: '{zinc.500}',
//           600: '{zinc.600}',
//           700: '{zinc.700}',
//           800: '{zinc.800}',
//           900: '{zinc.900}',
//           950: '{zinc.950}',
//         },
//       },
//     },
//   },
// });
