//Angular
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

//Aplicação
import { Toast } from './shared/components/toast/toast';
import { FloatingTimer } from './core/timer/components/floating-timer/floating-timer';
import { LoadingOverlay } from './shared/components/loading-overlay/loading-overlay';

//Externos
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-root',
  imports: [
    //Angular
    RouterOutlet,

    //Aplicação
    Toast,
    FloatingTimer,
    LoadingOverlay,

    //Externos
    ConfirmDialogModule,
  ],
  templateUrl: './app.html',
})
export class App {}
