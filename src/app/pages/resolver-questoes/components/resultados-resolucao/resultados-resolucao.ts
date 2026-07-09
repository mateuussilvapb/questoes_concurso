import { Component, computed, inject, input, output } from '@angular/core';
import { ResultadosResolucao } from '../resolver-questoes-page/resolver-questoes-page';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';
import { CardModule } from 'primeng/card';
import { CommonModule, PercentPipe } from '@angular/common';
import { ThemeService } from '../../../../core/services/theme.service';

export interface CardResultado {
  titleCard: string;
  textCard: string;
  textColorCard: string;
  backGroundColorCard: string;
  icon: string;
}

@Component({
  selector: 'app-resultados-resolucao',
  imports: [CommonModule, LayoutBasePages, CardModule],
  templateUrl: './resultados-resolucao.html',
})
export class ResultadosResolucaoComponent {
  protected readonly themeService = inject(ThemeService);

  resultados = input.required<ResultadosResolucao>();

  encerrar = output();

  aproveitamento = computed(
    () => this.resultados().totalQuestoesCorretas / this.resultados().totalQuestoesResolvidas,
  );

  tempoGastoEmMinutos = computed(
    () => this.resultados().tempoGasto / 60,
  );

  cards = computed<CardResultado[]>(() => {
    const aproveitamento = new PercentPipe('pt-BR').transform(this.aproveitamento(), '1.2-2');

    const isDarkMode = this.themeService.isDarkMode();

    return [
      {
        titleCard: 'Questões Resolvidas',
        textCard: String(this.resultados().totalQuestoesResolvidas),
        backGroundColorCard: '',
        textColorCard: '',
        icon: 'pi pi-file',
      },
      {
        titleCard: 'Corretas',
        textCard: String(this.resultados().totalQuestoesCorretas),
        backGroundColorCard: isDarkMode ? 'bg-green-900' : 'bg-green-300',
        textColorCard: isDarkMode ? 'text-green-300' : 'text-green-900',
        icon: 'pi pi-check',
      },
      {
        titleCard: 'Incorretas',
        textCard: String(this.resultados().totalQuestoesIncorretas),
        backGroundColorCard: isDarkMode ? 'bg-red-900' : 'bg-red-300',
        textColorCard: isDarkMode ? 'text-red-300' : 'text-red-900',
        icon: 'pi pi-times',
      },
      {
        titleCard: 'Aproveitamento',
        textCard: String(aproveitamento),
        backGroundColorCard: isDarkMode ? 'bg-blue-900' : 'bg-blue-300',
        textColorCard: isDarkMode ? 'text-blue-300' : 'text-blue-900',
        icon: 'pi pi-chart-pie',
      },
      {
        titleCard: 'Tempo gasto',
        textCard: String(this.tempoGastoEmMinutos() + 'm'),
        backGroundColorCard: isDarkMode ? 'bg-yellow-900' : 'bg-yellow-300',
        textColorCard: isDarkMode ? 'text-yellow-300' : 'text-yellow-900',
        icon: 'pi pi-clock',
      },
    ];
  });
}
