//Angular
import { Component, computed, inject, signal } from '@angular/core';

//Externos
import { ButtonModule } from 'primeng/button';

//Aplicação
import { LayoutService } from '../../services/layout.service';
import { SidebarMobile } from './sidebar-mobile/sidebar-mobile';
import { TopbarMenuOptions } from './topbar-menu-options/topbar-menu-options';
import { ThemeService } from '../../services/theme.service';

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
  protected readonly themeService = inject(ThemeService);

  logoByTheme = computed<string>(() => {
    return this.themeService.isDarkMode() ? 'assets/imgs/logo_dark.png' : 'assets/imgs/logo.png';
  });
}
