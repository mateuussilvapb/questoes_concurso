//Angular
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';

//Aplicação
import { ThemeService } from '../../../core/services/theme.service';

//Externos
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-layout-base-pages',
  imports: [CommonModule, ButtonModule],
  templateUrl: './layout-base-pages.html',
})
export class LayoutBasePages {
  private readonly themeService = inject(ThemeService);

  subtitle = input<string>();
  title = input.required<string>();
  buttonActionLabel = input<string>();
  buttonSeverity = input<'aplicattion' | 'secondary'>('aplicattion');

  actionButtonClick = output();

  colorTitle = computed<string>(() => {
    return this.themeService.isDarkMode() ? 'text-white-alpha-90' : 'text-gray-700';
  });

  colorSubtitle = computed<string>(() => {
    return this.themeService.isDarkMode() ? 'text-white-alpha-80' : 'text-gray-600';
  });

  isButtonSeverityApplication = computed(() => this.buttonSeverity() == 'aplicattion');

  onButtonActionClick() {
    this.actionButtonClick.emit();
  }
}
