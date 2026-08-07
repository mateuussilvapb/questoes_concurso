//Angular
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, effect, inject, signal } from '@angular/core';

//Aplicação
import { Util } from '../../../../shared/util/util';
import { Assunto } from '../../../assuntos/core/models/assunto.model';
import { Questao } from '../../../questoes/core/models/questao.model';
import { ResolverQuestoes } from '../../core/models/resolver-questoes.model';
import { ListBase } from '../../../../shared/components/list-base/list-base';
import { HistoricoService } from '../../../historico/core/services/historico.service';
import { QuestaoFilter } from '../../../questoes/core/dtos/filter-questao.dto';
import { QuestaoService } from './../../../questoes/core/services/questao.service';
import { ResultadosResolucaoComponent } from '../resultados-resolucao/resultados-resolucao';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';
import { ResolverQuestoesComponent } from '../resolver-questoes-component/resolver-questoes-component';
import { QuestaoFilter as QuestaoFilterComponent } from '../../../questoes/components/questao-filter/questao-filter';

//Externo
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

export interface ResultadosResolucao {
  totalQuestoesResolvidas: number;
  totalQuestoesCorretas: number;
  totalQuestoesIncorretas: number;
  tempoGasto: number;
}

@Component({
  selector: 'app-resolver-questoes-page',
  imports: [
    //Aplicação
    LayoutBasePages,
    QuestaoFilterComponent,
    ResolverQuestoesComponent,
    ResultadosResolucaoComponent,

    //Externo
    CardModule,
    DividerModule,
  ],
  templateUrl: './resolver-questoes-page.html',
})
export class ResolverQuestoesPage extends ListBase {
  private readonly questaoService = inject(QuestaoService);
  private readonly historicoService = inject(HistoricoService);

  protected readonly resolverMode = signal<boolean>(false);
  protected readonly resultadosMode = signal<boolean>(false);
  protected readonly questoesResolucao = signal<ResolverQuestoes[]>([]);
  protected readonly resultadoResolucao = signal<ResultadosResolucao | null>(null);

  constructor() {
    super();

    this.createForm();

    this.formValue = toSignal(this.form.valueChanges, {
      initialValue: this.form.getRawValue(),
    });

    effect(() => {
      const value = this.formValue();

      const filtro: QuestaoFilter = {
        ...value,
        tipo: value.tipo?.value,
        favorita: value.favorita?.value,
        revisada: value.revisada?.value,
        nivelDificuldade: value.nivelDificuldade?.value,
        marcadaParaRevisao: value.marcadaParaRevisao?.value,
        idMateria: value.idMateria?.id,
        idsAssuntos: value.idsAssuntos?.map((a: Assunto) => a.id),
        idBanca: value.idBanca?.id,
      };

      this.questaoService.pesquisar(filtro).then((questoes) => this.questoes.set(questoes));
    });
  }

  protected formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  protected questoes = signal<Questao[]>([]);

  createForm() {
    this.form = this.fb.group({
      enunciado: [null],
      observacao: [null],
      idMateria: [null],
      idsAssuntos: [[]],
      idBanca: [null],
      tipo: [null],
      nivelDificuldade: [null],
      favorita: [null],
      revisada: [null],
      marcadaParaRevisao: [null],
    });
  }

  questoesLength = computed(() => this.questoes().length);

  onResolverAction() {
    if (this.questoesLength() === 0) {
      this.messageService.showWarning(
        'Não existem questões disponíveis. Altere os filtros ou cadastre questões.',
        'Atenção!',
      );
      return;
    }

    const questoes = Util.shuffle(this.questoes()).map((q) => ({
      questao: q,
      resolvida: false,
      correta: false,
      alternativaId: '',
      tempoResposta: 0,
      respondidaEm: '',
    }));

    this.questoesResolucao.set(questoes);

    this.resolverMode.set(true);
  }

  textQuantidadeQuestoes = computed(() => {
    if (this.questoesLength() === 1) {
      return `${this.questoesLength()} questão disponível`;
    }
    return `${this.questoesLength()} questões disponíveis`;
  });

  onEncerrar() {
    this.form.reset();
    this.form.updateValueAndValidity();
    this.resolverMode.set(false);
  }

  onRespondeu(event: {
    questaoId: string;
    alternativaId: string;
    correta: boolean;
    tempoResposta: number;
    respondidaEm: string;
  }) {
    this.questoesResolucao.update((questoes) =>
      questoes.map((q) =>
        q.questao.id == event.questaoId
          ? {
              ...q,
              alternativaId: event.alternativaId,
              correta: event.correta,
              resolvida: true,
              tempoResposta: event.tempoResposta,
              respondidaEm: event.respondidaEm,
            }
          : q,
      ),
    );
  }

  onQuestaoAtualizada(questaoAtualizada: Questao) {
    this.questoesResolucao.update((questoes) =>
      questoes.map((q) =>
        q.questao.id === questaoAtualizada.id
          ? {
              ...q,
              questao: questaoAtualizada,
              resolvida: false,
              correta: false,
              alternativaId: '',
              tempoResposta: 0,
              respondidaEm: '',
            }
          : q,
      ),
    );
  }

  onFinalizar(resultados: ResultadosResolucao) {
    this.resultadoResolucao.set(resultados);
    this.resultadosMode.set(true);
  }

  async onEncerrarVisualizacaoResultados() {
    await this.persistirHistorico();

    this.form.reset();
    this.form.updateValueAndValidity();
    this.resultadoResolucao.set(null);
    this.resultadosMode.set(false);
    this.resolverMode.set(false);
  }

  private async persistirHistorico() {
    const resolvidas = this.questoesResolucao().filter((q) => q.resolvida);

    for (const resolucao of resolvidas) {
      await this.historicoService.criar({
        idQuestao: resolucao.questao.id,
        respondidaEm: resolucao.respondidaEm,
        idAlternativaSelecionada: resolucao.alternativaId,
        correta: resolucao.correta,
        tempoResposta: resolucao.tempoResposta,
        dificuldade: resolucao.questao.nivelDificuldade,
        idMateria: resolucao.questao.idMateria,
        idsAssuntos: resolucao.questao.idsAssuntos,
      });
    }
  }
}
