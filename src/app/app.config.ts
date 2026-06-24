import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { primeNgTranslation } from './i18n/primeng-pt';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: 'system',
          cssLayer: false,
        },
      },
      translation: primeNgTranslation,
      zIndex: {
        modal: 1100, // dialog, sidebarc
        overlay: 900, // dropdown, overlaypanel
        menu: 1000, // overlay menus
        tooltip: 1100, // tooltip
      },
    }),
  ],
};
