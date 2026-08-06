// Angular
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import { provideRouter } from '@angular/router';
import localePt from '@angular/common/locales/pt';
import { registerLocaleData } from '@angular/common';

// Aplicação
import { routes } from './app.routes';
import { PRIMENG_PROVIDER } from './core/config/providers/primeng.provider';
import { AppDatabase } from './core/database/app.database';

// Externos
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

registerLocaleData(localePt, 'pt-BR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    PRIMENG_PROVIDER,
    { provide: LOCALE_ID, useValue: 'pt-BR' }, // define o locale global
    { provide: AppDatabase, useClass: AppDatabase },
    DialogService,
    ConfirmationService,
    MessageService,
  ],
};

