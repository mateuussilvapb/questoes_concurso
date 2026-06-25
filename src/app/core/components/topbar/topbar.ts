//Angular
import { Component, inject } from '@angular/core';

//Externos
import { ButtonModule } from 'primeng/button';

//Aplicação
import { LayoutService } from '../../services/layout.service';
import { TopbarMenuOptions } from './topbar-menu-options/topbar-menu-options';
import { SidebarMobile } from './sidebar-mobile/sidebar-mobile';

@Component({
  selector: 'app-topbar',
  imports: [
    //Externos
    ButtonModule,

    //Aplicação
    SidebarMobile,
    TopbarMenuOptions,
  ],
  templateUrl: './topbar.html',
})
export class Topbar {
  protected readonly layoutService = inject(LayoutService);
}
