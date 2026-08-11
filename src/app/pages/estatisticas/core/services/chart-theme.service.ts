//Angular
import { Injectable, computed, effect, inject, signal } from '@angular/core';

//Aplicação
import { ThemeService } from '../../../../core/services/theme.service';

//Externo
import { ChartOptions } from 'chart.js';

export interface TokensGraficoTema {
  textColor: string;
  textMutedColor: string;
  borderColor: string;
  surfaceColor: string;
  tooltipBackground: string;
}

const FALLBACK_CLARO: TokensGraficoTema = {
  textColor: '#374151',
  textMutedColor: '#6B7280',
  borderColor: '#E5E7EB',
  surfaceColor: '#FFFFFF',
  tooltipBackground: '#111827',
};

const FALLBACK_ESCURO: TokensGraficoTema = {
  textColor: '#F3F4F6',
  textMutedColor: '#9CA3AF',
  borderColor: '#374151',
  surfaceColor: '#1F2937',
  tooltipBackground: '#0B0F19',
};

const MARCA_INICIO = { r: 0x4f, g: 0x46, b: 0xe5 };
const MARCA_MEIO = { r: 0x7c, g: 0x3a, b: 0xed };
const MARCA_FIM = { r: 0xc0, g: 0x26, b: 0xd3 };

@Injectable({
  providedIn: 'root',
})
export class ChartThemeService {
  private readonly themeService = inject(ThemeService);
  private readonly tokensSignal = signal<TokensGraficoTema>(FALLBACK_CLARO);

  readonly tokens = this.tokensSignal.asReadonly();

  readonly cores = {
    acerto: '#22C55E',
    erro: '#EF4444',
    marcaInicio: '#4F46E5',
    marcaMeio: '#7C3AED',
    marcaFim: '#C026D3',
  };

  readonly opcoesBase = computed<ChartOptions>(() => {
    const tokens = this.tokens();

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: tokens.textColor },
        },
        tooltip: {
          backgroundColor: tokens.tooltipBackground,
          titleColor: '#FFFFFF',
          bodyColor: '#FFFFFF',
        },
      },
      scales: {
        x: {
          ticks: { color: tokens.textMutedColor },
          grid: { color: tokens.borderColor },
        },
        y: {
          ticks: { color: tokens.textMutedColor },
          grid: { color: tokens.borderColor },
        },
      },
    };
  });

  constructor() {
    effect(() => {
      const isDark = this.themeService.isDarkMode();
      queueMicrotask(() => this.tokensSignal.set(this.lerTokens(isDark)));
    });
  }

  /** Interpola em RGB entre as três cores da marca (#4F46E5 → #7C3AED → #C026D3). */
  paletaMarca(quantidade: number): string[] {
    if (quantidade <= 0) return [];
    if (quantidade === 1) return [this.cores.marcaInicio];

    const cores: string[] = [];
    const metade = (quantidade - 1) / 2;

    for (let i = 0; i < quantidade; i++) {
      const posicao = i / (quantidade - 1); // 0..1
      let cor: { r: number; g: number; b: number };

      if (posicao <= 0.5) {
        cor = this.interpolar(MARCA_INICIO, MARCA_MEIO, metade === 0 ? 0 : posicao / 0.5);
      } else {
        cor = this.interpolar(MARCA_MEIO, MARCA_FIM, (posicao - 0.5) / 0.5);
      }

      cores.push(`rgb(${cor.r}, ${cor.g}, ${cor.b})`);
    }

    return cores;
  }

  escalaPercentual() {
    return {
      min: 0,
      max: 1,
      ticks: {
        callback: (valor: number | string) =>
          new Intl.NumberFormat('pt-BR', { style: 'percent' }).format(Number(valor)),
      },
    };
  }

  private interpolar(
    a: { r: number; g: number; b: number },
    b: { r: number; g: number; b: number },
    t: number,
  ): { r: number; g: number; b: number } {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t),
    };
  }

  private lerTokens(isDark: boolean): TokensGraficoTema {
    if (typeof document === 'undefined') return isDark ? FALLBACK_ESCURO : FALLBACK_CLARO;

    const estilo = getComputedStyle(document.documentElement);
    const padrao = isDark ? FALLBACK_ESCURO : FALLBACK_CLARO;
    const ler = (nome: string, fallback: string) =>
      estilo.getPropertyValue(nome).trim() || fallback;

    return {
      textColor: ler('--p-text-color', padrao.textColor),
      textMutedColor: ler('--p-text-muted-color', padrao.textMutedColor),
      borderColor: ler('--p-content-border-color', padrao.borderColor),
      surfaceColor: ler('--p-content-background', padrao.surfaceColor),
      tooltipBackground: padrao.tooltipBackground,
    };
  }
}
