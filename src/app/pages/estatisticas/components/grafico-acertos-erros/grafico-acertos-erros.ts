//Angular
import { PercentPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';

//Aplicação
import { ChartThemeService } from '../../core/services/chart-theme.service';
import { EstatisticasResumo } from '../../core/models/estatisticas-resumo.model';
import { GraficoCard } from '../grafico-card/grafico-card';

//Externo
import { ChartModule } from 'primeng/chart';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-grafico-acertos-erros',
  imports: [
    //Aplicação
    GraficoCard,

    //Externo
    ChartModule,
  ],
  templateUrl: './grafico-acertos-erros.html',
})
export class GraficoAcertosErros {
  private readonly chartTheme = inject(ChartThemeService);

  resumo = input.required<EstatisticasResumo>();

  protected readonly vazio = computed(() => this.resumo().totalRespondidas === 0);

  protected readonly percentualLabel = computed(() => {
    const aproveitamento = this.resumo().aproveitamento;
    return aproveitamento === null
      ? '-'
      : new PercentPipe('pt-BR').transform(aproveitamento, '1.0-0');
  });

  protected readonly dados = computed<ChartData>(() => {
    const resumo = this.resumo();
    const cores = this.chartTheme.cores;

    return {
      labels: ['Corretas', 'Incorretas'],
      datasets: [
        {
          data: [resumo.totalCorretas, resumo.totalIncorretas],
          backgroundColor: [cores.acerto, cores.erro],
          borderColor: [cores.acerto, cores.erro],
        },
      ],
    };
  });

  protected readonly opcoes = computed<ChartOptions>(() => {
    const base = this.chartTheme.opcoesBase();

    return {
      ...base,
      // Gráfico de rosca não usa eixos cartesianos — remove os eixos x/y herdados
      // de opcoesBase() (pensados para gráficos de barra/linha).
      scales: {},
      cutout: '68%',
      plugins: {
        ...base.plugins,
        legend: { ...base.plugins?.legend, position: 'bottom' },
      },
    };
  });
}
