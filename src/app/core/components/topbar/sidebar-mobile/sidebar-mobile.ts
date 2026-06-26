//Angular
import { Component, inject } from '@angular/core';

//Externos
import { DrawerModule } from 'primeng/drawer';

//Aplicação
import { LayoutService } from '../../../services/layout.service';
import { TopbarMenuOptions } from '../topbar-menu-options/topbar-menu-options';

@Component({
  selector: 'app-sidebar-mobile',
  imports: [
    //Externos
    DrawerModule,

    //Aplicação
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
