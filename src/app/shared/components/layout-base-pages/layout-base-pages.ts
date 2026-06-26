//Angular
import { Component, computed, inject, input, output } from '@angular/core';

//Aplicação
import { ThemeService } from '../../../core/services/theme.service';

//Externos
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-layout-base-pages',
  imports: [ButtonModule],
  templateUrl: './layout-base-pages.html',
  styleUrl: './layout-base-pages.scss',
})
export class LayoutBasePages {
  private readonly themeService = inject(ThemeService);

  title = input.required<string>();
  subtitle = input<string>();
  buttonActionLabel = input<string>();

  actionButtonClick = output();

  colorTitle = computed<string>(() => {
    return this.themeService.isDarkMode() ? 'text-white-alpha-90' : 'text-gray-700';
  });

  colorSubtitle = computed<string>(() => {
    return this.themeService.isDarkMode() ? 'text-white-alpha-80' : 'text-gray-600';
  });

  onButtonActionClick() {
    this.actionButtonClick.emit();
  }
}
