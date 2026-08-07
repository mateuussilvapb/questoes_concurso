//Angular
import { Component, computed, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

//Aplicação
import { ChartThemeService } from '../../core/services/chart-theme.service';
import { PontoEvolucao } from '../../core/models/ponto-evolucao.model';
import {
  GranularidadeTemporal,
  OPCOES_GRANULARIDADE_TEMPORAL,
} from '../../core/enums/granularidade-temporal.enum';
import { GraficoCard } from '../grafico-card/grafico-card';

//Externo
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-grafico-evolucao',
  imports: [
    //Angular
    FormsModule,

    //Aplicação
    GraficoCard,

    //Externo
    ChartModule,
    SelectModule,
  ],
  templateUrl: './grafico-evolucao.html',
})
export class GraficoEvolucao {
  private readonly chartTheme = inject(ChartThemeService);

  pontos = input.required<PontoEvolucao[]>();
  granularidade = model<GranularidadeTemporal>(GranularidadeTemporal.DIA);

  protected readonly opcoesGranularidade = OPCOES_GRANULARIDADE_TEMPORAL;

  protected readonly vazio = computed(() => this.pontos().length === 0);

  protected readonly dadosGrafico = computed<ChartData>(() => {
    const pontos = this.pontos();
    const cores = this.chartTheme.cores;

    return {
      labels: pontos.map((p) => p.label),
      datasets: [
        {
          type: 'bar',
          label: 'Questões respondidas',
          data: pontos.map((p) => p.totalRespondidas),
          backgroundColor: 'rgba(148, 163, 184, 0.4)',
          yAxisID: 'y',
          order: 2,
        },
        {
          type: 'line',
          label: 'Aproveitamento',
          data: pontos.map((p) => p.aproveitamento),
          borderColor: cores.marcaInicio,
          backgroundColor: cores.marcaInicio,
          spanGaps: false,
          tension: 0.3,
          yAxisID: 'y1',
          order: 0,
        },
        {
          type: 'line',
          label: 'Aproveitamento acumulado',
          data: pontos.map((p) => p.aproveitamentoAcumulado),
          borderColor: cores.marcaFim,
          backgroundColor: cores.marcaFim,
          borderDash: [6, 4],
          tension: 0.3,
          yAxisID: 'y1',
          order: 1,
        },
      ],
    };
  });

  protected readonly opcoesGrafico = computed<ChartOptions>(() => {
    const base = this.chartTheme.opcoesBase();

    return {
      ...base,
      scales: {
        x: base.scales?.['x'],
        y: {
          ...base.scales?.['y'],
          position: 'left',
          beginAtZero: true,
          title: { display: true, text: 'Questões' },
        },
        y1: {
          ...this.chartTheme.escalaPercentual(),
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'Aproveitamento' },
        },
      },
    };
  });
}
