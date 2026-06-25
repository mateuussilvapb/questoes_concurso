//Angular
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import { provideRouter } from '@angular/router';

//Aplicação
import { routes } from './app.routes';
import { PRIMENG_PROVIDER } from './core/config/providers/primeng.provider';

//Externos
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    PRIMENG_PROVIDER,
    { provide: LOCALE_ID, useValue: 'pt-BR' }, // define o locale global
    DialogService,
    ConfirmationService,
    MessageService,
  ],
};
