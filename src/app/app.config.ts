//Angular
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

//Aplicação
import { routes } from './app.routes';
import { PRIMENG_PROVIDER } from './core/config/providers/primeng.provider';

//Externos
import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    PRIMENG_PROVIDER,
    { provide: LOCALE_ID, useValue: 'pt-BR' }, // define o locale global
    DialogService,
    ConfirmationService,
    MessageService,
  ],
};
