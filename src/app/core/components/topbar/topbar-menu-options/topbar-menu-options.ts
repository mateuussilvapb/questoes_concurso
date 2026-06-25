//Angular
import { Component, computed, inject } from '@angular/core';

//Externos
import { ButtonModule } from 'primeng/button';

//Aplicação
import { LayoutService } from '../../../services/layout.service';
import { ThemeService } from './../../../services/theme.service';

@Component({
  selector: 'app-topbar-menu-options',
  imports: [
    //Externos
    ButtonModule,
  ],
  template: `
    <button
      pButton
      pRipple
      [outlined]="true"
      class="menu-buttons"
      severity="secondary"
      [icon]="getIconThemeMode()"
      (click)="this.toggleDarkMode()"
    ></button>
  `,
})
export class TopbarMenuOptions {
  private readonly themeService = inject(ThemeService);

  toggleDarkMode() {
    const element = document.querySelector('html');
    element?.classList.toggle('app-dark');
    this.themeService.toggleTheme();
  }

  getIconThemeMode = computed(() => {
    if (this.themeService.isDarkMode()) {
      return 'pi pi-moon';
    }
    return 'pi pi-sun';
  });
}
