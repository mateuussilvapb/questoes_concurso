//Angular
import { Component, computed, inject, input } from '@angular/core';

//Aplicação
import { ChartThemeService } from '../../core/services/chart-theme.service';
import { DesempenhoPorGrupo } from '../../core/models/desempenho-grupo.model';
import { GraficoCard } from '../grafico-card/grafico-card';

//Externo
import { ChartModule } from 'primeng/chart';
import { ChartData, ChartOptions } from 'chart.js';

const ALTURA_MINIMA = 60;
const ALTURA_POR_ITEM = 32;

@Component({
  selector: 'app-grafico-desempenho-grupo',
  imports: [
    //Aplicação
    GraficoCard,

    //Externo
    ChartModule,
  ],
  templateUrl: './grafico-desempenho-grupo.html',
})
export class GraficoDesempenhoGrupo {
  private readonly chartTheme = inject(ChartThemeService);

  titulo = input.required<string>();
  subtitulo = input<string>();
  dados = input.required<DesempenhoPorGrupo[]>();
  orientacao = input<'horizontal' | 'vertical'>('horizontal');
  limite = input<number>(10);
  ordenacao = input<'volume' | 'aproveitamento'>('volume');
  manterOrdem = input<boolean>(false);

  protected readonly itens = computed(() => {
    const dados = this.dados();

    if (this.manterOrdem()) {
      return dados.slice(0, this.limite());
    }

    const ordenados = [...dados].sort((a, b) => {
      if (this.ordenacao() === 'aproveitamento') {
        const aprovA = a.aproveitamento ?? -1;
        const aprovB = b.aproveitamento ?? -1;
        return aprovB - aprovA;
      }
      return b.totalRespondidas - a.totalRespondidas;
    });

    return ordenados.slice(0, this.limite());
  });

  protected readonly vazio = computed(() => this.itens().length === 0);

  protected readonly alturaCanvas = computed(() => {
    if (this.orientacao() === 'vertical') return '320px';

    return `${ALTURA_MINIMA + this.itens().length * ALTURA_POR_ITEM}px`;
  });

  protected readonly dadosGrafico = computed<ChartData>(() => {
    const itens = this.itens();
    const cores = this.chartTheme.cores;

    return {
      labels: itens.map((item) => (item.orfao ? `⚠ ${item.nomeGrupo}` : item.nomeGrupo)),
      datasets: [
        {
          label: 'Corretas',
          data: itens.map((item) => item.totalCorretas),
          backgroundColor: cores.acerto,
          stack: 'total',
        },
        {
          label: 'Incorretas',
          data: itens.map((item) => item.totalIncorretas),
          backgroundColor: cores.erro,
          stack: 'total',
        },
      ],
    };
  });

  protected readonly opcoesGrafico = computed<ChartOptions>(() => {
    const base = this.chartTheme.opcoesBase();
    const horizontal = this.orientacao() === 'horizontal';

    return {
      ...base,
      indexAxis: horizontal ? 'y' : 'x',
      scales: {
        x: { ...base.scales?.['x'], stacked: true },
        y: { ...base.scales?.['y'], stacked: true },
      },
    };
  });
}
