//Angular
import { CommonModule, PercentPipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';

//Aplicação
import { ThemeService } from '../../../../core/services/theme.service';
import { ResultadosResolucao } from '../resolver-questoes-page/resolver-questoes-page';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';

//Externo
import { CardModule } from 'primeng/card';

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

  tempoFormatado = computed(() => {
    const tempoGasto = this.resultados().tempoGasto;
    const minutos = Math.floor(tempoGasto / 60);
    const segundos = tempoGasto % 60;

    // O padStart garante que sempre existam 2 dígitos (ex: 05:42 em vez de 5:42)
    const minsStr = String(minutos).padStart(2, '0');
    const segsStr = String(segundos).padStart(2, '0');

    return `${minsStr}m ${segsStr}s`;
  });

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
        textCard: String(this.tempoFormatado()),
        backGroundColorCard: isDarkMode ? 'bg-yellow-900' : 'bg-yellow-300',
        textColorCard: isDarkMode ? 'text-yellow-300' : 'text-yellow-900',
        icon: 'pi pi-clock',
      },
    ];
  });
}
