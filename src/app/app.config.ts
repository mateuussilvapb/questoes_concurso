//Angular
import { provideRouter } from '@angular/router';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

//Aplicação
import { routes } from './app.routes';
import { primeNgTranslation } from './i18n/primeng-pt';

//Externos
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';

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
    ConfirmationService,
    MessageService,
  ],
};
