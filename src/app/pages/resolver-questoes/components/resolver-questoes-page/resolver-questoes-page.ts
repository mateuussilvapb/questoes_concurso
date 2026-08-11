//Angular
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, effect, inject, signal } from '@angular/core';

//Aplicação
import { Util } from '../../../../shared/util/util';
import { Materia } from '../../../materias/core/models/materia.model';
import { Assunto } from '../../../assuntos/core/models/assunto.model';
import { Questao } from '../../../questoes/core/models/questao.model';
import { ResolverQuestoes } from '../../core/models/resolver-questoes.model';
import { ListBase } from '../../../../shared/components/list-base/list-base';
import { MateriaService } from '../../../materias/core/services/materia.service';
import { HistoricoService } from '../../../historico/core/services/historico.service';
import { QuestaoFilter } from '../../../questoes/core/dtos/filter-questao.dto';
import { QuestaoService } from './../../../questoes/core/services/questao.service';
import { ResultadosResolucaoComponent } from '../resultados-resolucao/resultados-resolucao';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';
import { ResolverQuestoesComponent } from '../resolver-questoes-component/resolver-questoes-component';
import { QuestaoFilter as QuestaoFilterComponent } from '../../../questoes/components/questao-filter/questao-filter';
import { TipoAgrupamento } from '../../../estatisticas/core/enums/tipo-agrupamento.enum';
import {
  NIVEL_DIFICULDADE_LABEL,
  NivelDificuldade,
} from '../../../questoes/core/enums/nivel-dificuldade.enum';
import { DesempenhoPorGrupo } from '../../../estatisticas/core/models/desempenho-grupo.model';

//Externo
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

export interface ResultadosResolucao {
  totalQuestoesResolvidas: number;
  totalQuestoesCorretas: number;
  totalQuestoesIncorretas: number;
  tempoGasto: number;
}

/** Base de comparação da sessão atual: histórico anterior, já sem os registros da própria sessão. */
export interface ComparativoHistorico {
  aproveitamentoAnterior: number;
  totalRespondidasAnterior: number;
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
  private readonly materiaService = inject(MateriaService);
  private readonly historicoService = inject(HistoricoService);

  protected readonly resolverMode = signal<boolean>(false);
  protected readonly resultadosMode = signal<boolean>(false);
  protected readonly questoesResolucao = signal<ResolverQuestoes[]>([]);
  protected readonly resultadoResolucao = signal<ResultadosResolucao | null>(null);
  protected readonly materias = signal<Materia[]>([]);
  protected readonly comparativoHistorico = signal<ComparativoHistorico | null>(null);

  constructor() {
    super();

    this.materiaService.listar().then((materias) => this.materias.set(materias));

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
      idHistorico: null,
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

  async onEncerrar(event: { persistir: boolean }) {
    if (!event.persistir) {
      await this.descartarHistoricoSessao();
    }

    this.form.reset();
    this.form.updateValueAndValidity();
    this.resolverMode.set(false);
  }

  async onRespondeu(event: {
    questaoId: string;
    alternativaId: string;
    correta: boolean;
    tempoResposta: number;
    respondidaEm: string;
  }) {
    const item = this.questoesResolucao().find((q) => q.questao.id === event.questaoId);

    if (!item) {
      return;
    }

    const historico = await this.historicoService.criar({
      idQuestao: item.questao.id,
      respondidaEm: event.respondidaEm,
      idAlternativaSelecionada: event.alternativaId,
      correta: event.correta,
      tempoResposta: event.tempoResposta,
      dificuldade: item.questao.nivelDificuldade,
      idMateria: item.questao.idMateria,
      idsAssuntos: item.questao.idsAssuntos,
    });

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
              idHistorico: historico.id,
            }
          : q,
      ),
    );
  }

  async onQuestaoAtualizada(questaoAtualizada: Questao) {
    const item = this.questoesResolucao().find((q) => q.questao.id === questaoAtualizada.id);

    if (item?.idHistorico) {
      await this.historicoService.remover(item.idHistorico);
    }

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
              idHistorico: null,
            }
          : q,
      ),
    );
  }

  onComentarioAtualizado(questaoAtualizada: Questao) {
    this.questoesResolucao.update((questoes) =>
      questoes.map((q) =>
        q.questao.id === questaoAtualizada.id ? { ...q, questao: questaoAtualizada } : q,
      ),
    );
  }

  onStatusAtualizado(questaoAtualizada: Questao) {
    this.questoesResolucao.update((questoes) =>
      questoes.map((q) =>
        q.questao.id === questaoAtualizada.id ? { ...q, questao: questaoAtualizada } : q,
      ),
    );
  }

  async onFinalizar(resultados: ResultadosResolucao) {
    this.resultadoResolucao.set(resultados);
    await this.carregarComparativoHistorico();
    this.resultadosMode.set(true);
  }

  /**
   * Monta a base de comparação da sessão contra o histórico anterior.
   *
   * Como o histórico é persistido a cada resposta, os registros da sessão atual já
   * estão gravados quando os resultados são exibidos. Por isso eles são descartados
   * aqui: caso contrário a sessão entraria na própria média e o comparativo ficaria
   * sempre atenuado.
   */
  private async carregarComparativoHistorico() {
    const idsDaSessao = new Set(
      this.questoesResolucao()
        .map((item) => item.idHistorico)
        .filter((id): id is string => !!id),
    );

    const anteriores = (await this.historicoService.listar()).filter(
      (historico) => !idsDaSessao.has(historico.id),
    );

    if (anteriores.length === 0) {
      this.comparativoHistorico.set(null);
      return;
    }

    const corretas = anteriores.filter((historico) => historico.correta).length;

    this.comparativoHistorico.set({
      aproveitamentoAnterior: corretas / anteriores.length,
      totalRespondidasAnterior: anteriores.length,
    });
  }

  questoesErradas = computed(() =>
    this.questoesResolucao()
      .filter((q) => q.resolvida && !q.correta)
      .map((q) => q.questao),
  );

  desempenhoPorMateria = computed<DesempenhoPorGrupo[]>(() => {
    const materiasPorId = new Map(this.materias().map((m) => [m.id, m.nome]));
    const porMateria = new Map<string, { corretas: number; incorretas: number }>();

    for (const item of this.questoesResolucao()) {
      if (!item.resolvida) continue;

      const idMateria = item.questao.idMateria;
      const atual = porMateria.get(idMateria) ?? { corretas: 0, incorretas: 0 };

      if (item.correta) {
        atual.corretas++;
      } else {
        atual.incorretas++;
      }

      porMateria.set(idMateria, atual);
    }

    return Array.from(porMateria.entries()).map(([idMateria, totais]) => {
      const totalRespondidas = totais.corretas + totais.incorretas;

      return {
        idGrupo: idMateria,
        nomeGrupo: materiasPorId.get(idMateria) ?? 'Matéria removida',
        tipo: TipoAgrupamento.MATERIA,
        orfao: !materiasPorId.has(idMateria),
        totalRespondidas,
        totalCorretas: totais.corretas,
        totalIncorretas: totais.incorretas,
        aproveitamento: totalRespondidas > 0 ? totais.corretas / totalRespondidas : null,
        tempoMedioResposta: null,
        tempoTotal: 0,
      };
    });
  });

  nomesPorMateria = computed<Record<string, string>>(() =>
    Object.fromEntries(this.materias().map((materia) => [materia.id, materia.nome])),
  );

  desempenhoPorDificuldade = computed<DesempenhoPorGrupo[]>(() => {
    const porDificuldade = new Map<NivelDificuldade, { corretas: number; incorretas: number }>();

    for (const item of this.questoesResolucao()) {
      if (!item.resolvida) continue;

      const dificuldade = item.questao.nivelDificuldade;
      const atual = porDificuldade.get(dificuldade) ?? { corretas: 0, incorretas: 0 };

      if (item.correta) {
        atual.corretas++;
      } else {
        atual.incorretas++;
      }

      porDificuldade.set(dificuldade, atual);
    }

    // Mantém a ordem natural do enum (Muito Fácil -> Muito Difícil) no gráfico.
    return Array.from(porDificuldade.entries())
      .sort(([a], [b]) => a - b)
      .map(([dificuldade, totais]) => {
        const totalRespondidas = totais.corretas + totais.incorretas;

        return {
          idGrupo: String(dificuldade),
          nomeGrupo: NIVEL_DIFICULDADE_LABEL[dificuldade],
          tipo: TipoAgrupamento.DIFICULDADE,
          orfao: false,
          totalRespondidas,
          totalCorretas: totais.corretas,
          totalIncorretas: totais.incorretas,
          aproveitamento: totalRespondidas > 0 ? totais.corretas / totalRespondidas : null,
          tempoMedioResposta: null,
          tempoTotal: 0,
        };
      });
  });

  onRevisarErradasAgora() {
    const questoes = Util.shuffle(this.questoesErradas()).map((q) => ({
      questao: q,
      resolvida: false,
      correta: false,
      alternativaId: '',
      tempoResposta: 0,
      respondidaEm: '',
      idHistorico: null,
    }));

    this.questoesResolucao.set(questoes);
    this.resultadoResolucao.set(null);
    this.comparativoHistorico.set(null);
    this.resultadosMode.set(false);
    this.resolverMode.set(true);
  }

  async onMarcarErradasParaRevisao() {
    const questoesErradas = this.questoesErradas();

    try {
      await Promise.all(questoesErradas.map((q) => this.questaoService.marcarParaRevisao(q.id)));

      this.questoesResolucao.update((questoes) =>
        questoes.map((item) =>
          questoesErradas.some((q) => q.id === item.questao.id)
            ? {
                ...item,
                questao: {
                  ...item.questao,
                  status: { ...item.questao.status, marcadaParaRevisao: true },
                },
              }
            : item,
        ),
      );

      this.messageService.showSuccess('Questões erradas marcadas para revisão.', 'Sucesso!');
    } catch (e: any) {
      console.error(e);
      const mensagem = e?.message ?? 'Erro ao marcar questões para revisão. Tente novamente.';
      this.messageService.showError(mensagem);
    }
  }

  onEncerrarVisualizacaoResultados() {
    this.form.reset();
    this.form.updateValueAndValidity();
    this.resultadoResolucao.set(null);
    this.comparativoHistorico.set(null);
    this.resultadosMode.set(false);
    this.resolverMode.set(false);
  }

  private async descartarHistoricoSessao() {
    const persistidas = this.questoesResolucao().filter((q) => q.idHistorico);

    for (const resolucao of persistidas) {
      await this.historicoService.remover(resolucao.idHistorico!);
    }
  }
}
