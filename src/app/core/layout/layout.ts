//Angular
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Component, inject } from '@angular/core';

//Aplicação
import { Topbar } from '../components/topbar/topbar';
import { Sidebar } from '../components/sidebar/sidebar';
import { LayoutService } from '../services/layout.service';

@Component({
  selector: 'app-layout',
  imports: [
    //Angular
    CommonModule,
    RouterOutlet,

    //Aplicação
    Sidebar,
    Topbar,
  ],
  templateUrl: './layout.html',
})
export class Layout {
  protected readonly layoutService = inject(LayoutService);
}
