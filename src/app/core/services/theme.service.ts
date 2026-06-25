import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // Inicializa o sinal buscando do localStorage ou respeitando a preferência do sistema
  private readonly isDarkSignal = signal<boolean>(this.getInitialTheme());

  // Expõe apenas como leitura para os componentes
  readonly isDarkMode = this.isDarkSignal.asReadonly();

  constructor() {
    // Esse efeito roda automaticamente sempre que o valor do sinal mudar
    effect(() => {
      this.updateRenderedTheme(this.isDarkSignal());
    });
  }

  toggleTheme(): void {
    this.isDarkSignal.update((dark) => !dark);
  }

  private getInitialTheme(): boolean {
    if (globalThis.window?.localStorage) {
      const stored = localStorage.getItem('user-theme');
      if (stored) return stored === 'dark';

      // Se não houver histórico, verifica a preferência do sistema operacional
      return globalThis.window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }

  private updateRenderedTheme(isDark: boolean): void {
    if (typeof document === 'undefined') return;

    const htmlElement = document.documentElement;
    if (isDark) {
      htmlElement.classList.add('app-dark');
      localStorage.setItem('user-theme', 'dark');
    } else {
      htmlElement.classList.remove('app-dark');
      localStorage.setItem('user-theme', 'light');
    }
  }
}
