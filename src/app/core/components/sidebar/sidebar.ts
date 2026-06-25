//Angular
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

//Aplicação

//Externos
import { filter, Subscription } from 'rxjs';
import { DrawerModule } from 'primeng/drawer';
import { LayoutService } from '../../services/layout.service';
import { Menu } from './menu/menu';

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
