//Angular
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

//Aplicação
import { Toast } from './shared/components/toast/toast';

//Externos
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-root',
  imports: [
    //Angular
    RouterOutlet,

    //Aplicação
    Toast,

    //Externos
    ConfirmDialogModule,
  ],
  templateUrl: './app.html',
})
export class App {}
