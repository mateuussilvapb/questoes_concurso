//Angular
import { Component, computed, inject, signal } from '@angular/core';

//Externos
import { DrawerModule } from 'primeng/drawer';
import { LayoutService } from '../../../services/layout.service';
import { TopbarMenuOptions } from '../topbar-menu-options/topbar-menu-options';

//Internos

@Component({
  selector: 'app-sidebar-mobile',
  imports: [
    //Externos
    DrawerModule,

    //Internos
    TopbarMenuOptions,
  ],
  template: `
    <p-drawer
      position="right"
      [(visible)]="visible"
      styleClass="layout-config-sidebar w-5rem"
      [transitionOptions]="'.3s cubic-bezier(0, 0, 0.2, 1)'"
    >
      <app-topbar-menu-options></app-topbar-menu-options>
    </p-drawer>
  `,
})
export class SidebarMobile {
  private readonly layoutService = inject(LayoutService);

  get visible(): boolean {
    return this.layoutService.state().sidebarMenuOptionsVisible;
  }

  set visible(val: boolean) {
    this.layoutService.state.update((state) => ({
      ...state,
      sidebarMenuOptionsVisible: val,
    }));
  }

}
