//Angular
import { Component, computed, input } from '@angular/core';

//Aplicação
import { DesempenhoPorGrupo } from '../../core/models/desempenho-grupo.model';
import { MINIMO_QUESTOES_RELEVANCIA } from '../../core/shared/contexto-estatistica';
import { GraficoCard } from '../grafico-card/grafico-card';

//Externo
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-ranking-pontos-fracos',
  imports: [
    //Aplicação
    GraficoCard,

    //Externo
    ProgressBarModule,
  ],
  templateUrl: './ranking-pontos-fracos.html',
})
export class RankingPontosFracos {
  itens = input.required<DesempenhoPorGrupo[]>();
  titulo = input<string>('Pontos Fracos');
  minimoQuestoes = input<number>(MINIMO_QUESTOES_RELEVANCIA);

  protected readonly vazio = computed(() => this.itens().length === 0);

  protected readonly mensagemVazia = computed(
    () =>
      `Responda pelo menos ${this.minimoQuestoes()} questões de um assunto para ele aparecer aqui.`,
  );

  percentual(item: DesempenhoPorGrupo): number {
    return Math.round((item.aproveitamento ?? 0) * 100);
  }
}
