//Angular
import { PercentPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';

//Aplicação
import { ChartThemeService } from '../../core/services/chart-theme.service';
import { Util } from '../../../../shared/util/util';
import { DesempenhoPorGrupo } from '../../core/models/desempenho-grupo.model';
import { DesempenhoPorFaixaTempo } from '../../core/models/desempenho-tempo.model';
import { FaixaTempoResposta } from '../../core/enums/faixa-tempo-resposta.enum';
import { MINIMO_QUESTOES_RELEVANCIA } from '../../core/shared/contexto-estatistica';
import { GraficoCard } from '../grafico-card/grafico-card';

//Externo
import { ChartModule } from 'primeng/chart';
import { ChartData, ChartOptions } from 'chart.js';

const FRASE_FAIXA: Record<FaixaTempoResposta, string> = {
  [FaixaTempoResposta.ATE_30S]: 'em até 30s',
  [FaixaTempoResposta.DE_30S_A_1MIN]: 'entre 30s e 1min',
  [FaixaTempoResposta.DE_1MIN_A_2MIN]: 'entre 1min e 2min',
  [FaixaTempoResposta.ACIMA_2MIN]: 'em mais de 2min',
};

@Component({
  selector: 'app-analise-tempo',
  imports: [
    //Aplicação
    GraficoCard,

    //Externo
    ChartModule,
  ],
  templateUrl: './analise-tempo.html',
})
export class AnaliseTempo {
  private readonly chartTheme = inject(ChartThemeService);

  porMateria = input.required<DesempenhoPorGrupo[]>();
  porDificuldade = input.required<DesempenhoPorGrupo[]>();
  faixasTempo = input.required<DesempenhoPorFaixaTempo[]>();

  protected readonly materiasOrdenadas = computed(() =>
    [...this.porMateria()]
      .filter((m) => m.totalRespondidas > 0)
      .sort((a, b) => b.totalRespondidas - a.totalRespondidas)
      .slice(0, 10),
  );

  protected readonly vazioMateria = computed(() => this.materiasOrdenadas().length === 0);
  protected readonly vazioDificuldade = computed(() =>
    this.porDificuldade().every((d) => d.totalRespondidas === 0),
  );
  protected readonly vazioFaixas = computed(() =>
    this.faixasTempo().every((f) => f.totalRespondidas === 0),
  );

  protected readonly insight = computed<string | null>(() => {
    const elegiveis = this.faixasTempo().filter(
      (f) => f.totalRespondidas >= MINIMO_QUESTOES_RELEVANCIA && f.aproveitamento !== null,
    );

    if (elegiveis.length < 2) return null;

    const melhor = elegiveis.reduce((a, b) => (b.aproveitamento! > a.aproveitamento! ? b : a));
    const pior = elegiveis.reduce((a, b) => (b.aproveitamento! < a.aproveitamento! ? b : a));

    if (melhor.faixa === pior.faixa) return null;

    const pct = (v: number) => new PercentPipe('pt-BR').transform(v, '1.0-0');

    return `Você acerta ${pct(melhor.aproveitamento!)} do que responde ${FRASE_FAIXA[melhor.faixa]}, mas só ${pct(pior.aproveitamento!)} do que responde ${FRASE_FAIXA[pior.faixa]}.`;
  });

  protected readonly dadosMateria = computed<ChartData>(() => {
    const itens = this.materiasOrdenadas();
    const cores = this.chartTheme.paletaMarca(itens.length);

    return {
      labels: itens.map((m) => (m.orfao ? `⚠ ${m.nomeGrupo}` : m.nomeGrupo)),
      datasets: [
        {
          label: 'Tempo médio (s)',
          data: itens.map((m) => m.tempoMedioResposta ?? 0),
          backgroundColor: cores,
        },
      ],
    };
  });

  protected readonly opcoesMateria = computed<ChartOptions>(() => {
    const base = this.chartTheme.opcoesBase();

    return {
      ...base,
      indexAxis: 'y',
      plugins: {
        ...base.plugins,
        tooltip: {
          ...base.plugins?.tooltip,
          callbacks: {
            label: (item: any) => Util.formatarDuracao(Number(item.raw)),
          },
        },
      },
    };
  });

  protected readonly dadosDificuldade = computed<ChartData>(() => {
    const itens = this.porDificuldade();
    const cores = this.chartTheme.paletaMarca(itens.length);

    return {
      labels: itens.map((d) => d.nomeGrupo),
      datasets: [
        {
          label: 'Tempo médio (s)',
          data: itens.map((d) => d.tempoMedioResposta ?? 0),
          backgroundColor: cores,
        },
      ],
    };
  });

  protected readonly opcoesDificuldade = computed<ChartOptions>(() => {
    const base = this.chartTheme.opcoesBase();

    return {
      ...base,
      plugins: {
        ...base.plugins,
        tooltip: {
          ...base.plugins?.tooltip,
          callbacks: {
            label: (item: any) => Util.formatarDuracao(Number(item.raw)),
          },
        },
      },
    };
  });

  protected readonly dadosFaixas = computed<ChartData>(() => {
    const itens = this.faixasTempo();
    const cores = this.chartTheme.paletaMarca(itens.length);

    return {
      labels: itens.map((f) => f.label),
      datasets: [
        {
          label: 'Aproveitamento',
          data: itens.map((f) => f.aproveitamento),
          backgroundColor: itens.map((f, i) =>
            f.totalRespondidas < MINIMO_QUESTOES_RELEVANCIA
              ? this.comOpacidadeReduzida(cores[i])
              : cores[i],
          ),
        },
      ],
    };
  });

  protected readonly opcoesFaixas = computed<ChartOptions>(() => {
    const base = this.chartTheme.opcoesBase();

    return {
      ...base,
      scales: {
        x: base.scales?.['x'],
        y: this.chartTheme.escalaPercentual(),
      },
    };
  });

  private comOpacidadeReduzida(corRgb: string): string {
    return corRgb.replace('rgb(', 'rgba(').replace(')', ', 0.4)');
  }
}
