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
      darkModeSelector: '.app-dark-mode',
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
