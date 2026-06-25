//Angular
import { Router } from '@angular/router';
import { Component, computed, inject } from '@angular/core';

//Aplicação
import { Menu } from './menu/menu';
import { LayoutService } from '../../services/layout.service';

//Externos
import { DrawerModule } from 'primeng/drawer';

@Component({
  selector: 'app-sidebar',
  imports: [
    //Externos
    DrawerModule,

    //Aplicação
    Menu,
  ],
  template: `
    @if (this.layoutService.isDesktop() && this.layoutService.mainMenuVisible()) {
      <div animate.enter="slide-in" animate.leave="slide-out" class="layout-sidebar">
        <app-menu></app-menu>
      </div>
    }
    @if (this.layoutService.isMobile()) {
      <div>
        <p-drawer [showCloseIcon]="false" [visible]="this.layoutService.mainMenuVisible()">
          <app-menu></app-menu
        ></p-drawer>
      </div>
    }
  `,
  styleUrls: ['./sidebar.scss'],
})
export class Sidebar {
  protected readonly layoutService: LayoutService = inject(LayoutService);
  protected readonly router: Router = inject(Router);

  showMenuDesktop = computed(() => this.layoutService.isDesktop() && this.layoutService.mainMenuVisible());

  showMenuMobile = computed(() => this.layoutService.isMobile() && this.layoutService.mainMenuVisible());
}
