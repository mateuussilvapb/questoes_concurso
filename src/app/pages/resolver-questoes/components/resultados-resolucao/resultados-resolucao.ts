//Angular
import { PercentPipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';

//Aplicação
import { Util } from '../../../../shared/util/util';
import { Questao } from '../../../questoes/core/models/questao.model';
import { ThemeService } from '../../../../core/services/theme.service';
import { ResolverQuestoes } from '../../core/models/resolver-questoes.model';
import {
  ComparativoHistorico,
  ResultadosResolucao,
} from '../resolver-questoes-page/resolver-questoes-page';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';
import { AcentoKpi, KpiCard } from '../../../../shared/components/kpi-card/kpi-card';
import { EstatisticasResumo } from '../../../estatisticas/core/models/estatisticas-resumo.model';
import { DesempenhoPorGrupo } from '../../../estatisticas/core/models/desempenho-grupo.model';
import { GraficoAcertosErros } from '../../../estatisticas/components/grafico-acertos-erros/grafico-acertos-erros';
import { GraficoDesempenhoGrupo } from '../../../estatisticas/components/grafico-desempenho-grupo/grafico-desempenho-grupo';
import {
  NIVEL_DIFICULDADE_LABEL,
  STYLE_CLASS_TAG_DIFICULDADE_DARK,
  STYLE_CLASS_TAG_DIFICULDADE_LIGHT,
} from '../../../questoes/core/enums/nivel-dificuldade.enum';

//Externo
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

/** Quantidade máxima de questões erradas listadas antes de resumir o restante. */
const LIMITE_ERRADAS_LISTADAS = 5;

/** Tamanho máximo do trecho de enunciado exibido na lista de erradas. */
const TAMANHO_TRECHO_ENUNCIADO = 140;

export interface QuestaoErradaResumo {
  id: string;
  trecho: string;
  materia: string;
  labelDificuldade: string;
  classeDificuldade: string;
}

interface KpiResultado {
  titulo: string;
  valor: string;
  icone: string;
  acento: AcentoKpi;
}

interface FaixaDesempenho {
  mensagem: string;
  classeTexto: string;
}

interface ComparativoExibicao {
  texto: string;
  base: string;
  icone: string;
  classeTexto: string;
}

@Component({
  selector: 'app-resultados-resolucao',
  imports: [
    //Aplicação
    KpiCard,
    LayoutBasePages,
    GraficoAcertosErros,
    GraficoDesempenhoGrupo,

    //Externo
    CardModule,
    ButtonModule,
  ],
  templateUrl: './resultados-resolucao.html',
})
export class ResultadosResolucaoComponent {
  protected readonly themeService = inject(ThemeService);

  resultados = input.required<ResultadosResolucao>();
  questoesErradas = input<Questao[]>([]);
  desempenhoPorMateria = input<DesempenhoPorGrupo[]>([]);
  desempenhoPorDificuldade = input<DesempenhoPorGrupo[]>([]);
  itensResolucao = input<ResolverQuestoes[]>([]);
  nomesPorMateria = input<Record<string, string>>({});
  comparativoHistorico = input<ComparativoHistorico | null>(null);

  encerrar = output();
  revisarErradasAgora = output();
  marcarErradasParaRevisao = output();

  temQuestoesErradas = computed(() => this.questoesErradas().length > 0);

  mostrarGraficoMateria = computed(() => this.desempenhoPorMateria().length >= 2);

  mostrarGraficoDificuldade = computed(() => this.desempenhoPorDificuldade().length >= 2);

  aproveitamento = computed(() => {
    const resultados = this.resultados();

    if (resultados.totalQuestoesResolvidas === 0) {
      return 0;
    }

    return resultados.totalQuestoesCorretas / resultados.totalQuestoesResolvidas;
  });

  aproveitamentoLabel = computed(
    () => new PercentPipe('pt-BR').transform(this.aproveitamento(), '1.0-0') ?? '0%',
  );

  /** Largura, em porcentagem, dos segmentos da barra de acertos x erros do destaque. */
  percentualAcertos = computed(() => this.aproveitamento() * 100);

  faixaDesempenho = computed<FaixaDesempenho>(() => {
    const aproveitamento = this.aproveitamento();

    if (aproveitamento >= 0.8) {
      return { mensagem: 'Excelente desempenho nesta sessão!', classeTexto: 'text-green-500' };
    }

    if (aproveitamento >= 0.6) {
      return { mensagem: 'Bom desempenho, continue assim.', classeTexto: 'text-blue-500' };
    }

    if (aproveitamento >= 0.4) {
      return {
        mensagem: 'Desempenho regular, vale revisar os erros.',
        classeTexto: 'text-yellow-500',
      };
    }

    return {
      mensagem: 'Aproveite para revisar o conteúdo com calma.',
      classeTexto: 'text-red-500',
    };
  });

  /**
   * Compara o aproveitamento da sessão com o das questões respondidas antes dela.
   *
   * A diferença é expressa em pontos percentuais (p.p.), e não em porcentagem, para
   * não confundir "subiu 5 p.p." com "subiu 5%".
   */
  comparativo = computed<ComparativoExibicao | null>(() => {
    const historico = this.comparativoHistorico();

    if (!historico) {
      return null;
    }

    const percentual = new PercentPipe('pt-BR');
    const media = percentual.transform(historico.aproveitamentoAnterior, '1.0-0') ?? '0%';
    const base = `com base em ${historico.totalRespondidasAnterior} questão(ões) anterior(es)`;
    const pontos = Math.round((this.aproveitamento() - historico.aproveitamentoAnterior) * 100);

    if (pontos > 0) {
      return {
        texto: `${pontos} p.p. acima da sua média de ${media}`,
        base,
        icone: 'pi pi-arrow-up',
        classeTexto: 'text-green-500',
      };
    }

    if (pontos < 0) {
      return {
        texto: `${Math.abs(pontos)} p.p. abaixo da sua média de ${media}`,
        base,
        icone: 'pi pi-arrow-down',
        classeTexto: 'text-red-500',
      };
    }

    return {
      texto: `Em linha com a sua média de ${media}`,
      base,
      icone: 'pi pi-minus',
      classeTexto: 'text-color-secondary',
    };
  });

  tempoFormatado = computed(() => {
    const tempoGasto = this.resultados().tempoGasto;
    const minutos = Math.floor(tempoGasto / 60);
    const segundos = tempoGasto % 60;

    // O padStart garante que sempre existam 2 dígitos (ex: 05:42 em vez de 5:42)
    const minsStr = String(minutos).padStart(2, '0');
    const segsStr = String(segundos).padStart(2, '0');

    return `${minsStr}m ${segsStr}s`;
  });

  tempoMedioFormatado = computed(() => {
    const resultados = this.resultados();

    if (resultados.totalQuestoesResolvidas === 0) {
      return '-';
    }

    return Util.formatarDuracao(resultados.tempoGasto / resultados.totalQuestoesResolvidas);
  });

  /** Maior quantidade de acertos consecutivos, na ordem em que as questões foram respondidas. */
  melhorSequenciaAcertos = computed(() => {
    const respondidas = this.itensResolucao()
      .filter((item) => item.resolvida)
      .sort((a, b) => a.respondidaEm.localeCompare(b.respondidaEm));

    let melhor = 0;
    let atual = 0;

    for (const item of respondidas) {
      atual = item.correta ? atual + 1 : 0;
      melhor = Math.max(melhor, atual);
    }

    return melhor;
  });

  /**
   * Define a largura das colunas dos gráficos.
   *
   * Com um único gráfico ele ocupa a linha inteira, evitando o card solto pela
   * metade da tela que exigia deslocamento manual de colunas.
   */
  classeColunaGrafico = computed(() => {
    const totalGraficos =
      1 + (this.mostrarGraficoMateria() ? 1 : 0) + (this.mostrarGraficoDificuldade() ? 1 : 0);

    return totalGraficos === 1 ? 'col-12' : 'col-12 lg:col-6';
  });

  listaErradas = computed<QuestaoErradaResumo[]>(() => {
    const nomes = this.nomesPorMateria();
    const isDarkMode = this.themeService.isDarkMode();

    return this.questoesErradas()
      .slice(0, LIMITE_ERRADAS_LISTADAS)
      .map((questao) => {
        const texto = Util.htmlToText(questao.enunciado);

        return {
          id: questao.id,
          trecho:
            texto.length > TAMANHO_TRECHO_ENUNCIADO
              ? `${texto.slice(0, TAMANHO_TRECHO_ENUNCIADO)}...`
              : texto,
          materia: nomes[questao.idMateria] ?? 'Matéria removida',
          labelDificuldade: NIVEL_DIFICULDADE_LABEL[questao.nivelDificuldade],
          classeDificuldade: isDarkMode
            ? STYLE_CLASS_TAG_DIFICULDADE_DARK[questao.nivelDificuldade]
            : STYLE_CLASS_TAG_DIFICULDADE_LIGHT[questao.nivelDificuldade],
        };
      });
  });

  totalErradasNaoListadas = computed(() =>
    Math.max(0, this.questoesErradas().length - LIMITE_ERRADAS_LISTADAS),
  );

  /** Adapta os totais da sessão para o formato esperado pelo gráfico de Acertos x Erros. */
  resumoParaGrafico = computed<EstatisticasResumo>(() => {
    const resultados = this.resultados();

    return {
      totalRespondidas: resultados.totalQuestoesResolvidas,
      totalCorretas: resultados.totalQuestoesCorretas,
      totalIncorretas: resultados.totalQuestoesIncorretas,
      aproveitamento: resultados.totalQuestoesResolvidas > 0 ? this.aproveitamento() : null,
      tempoMedioResposta: null,
      tempoTotalEstudo: resultados.tempoGasto,
      diasEstudados: 0,
      mediaQuestoesPorDia: null,
      sequenciaAtualDias: 0,
      sequenciaRecordeDias: 0,
      primeiraRespostaEm: null,
      ultimaRespostaEm: null,
    };
  });

  kpis = computed<KpiResultado[]>(() => {
    const resultados = this.resultados();

    return [
      {
        titulo: 'Questões Resolvidas',
        valor: String(resultados.totalQuestoesResolvidas),
        icone: 'pi pi-file',
        acento: 'marca',
      },
      {
        titulo: 'Corretas',
        valor: String(resultados.totalQuestoesCorretas),
        icone: 'pi pi-check',
        acento: 'sucesso',
      },
      {
        titulo: 'Incorretas',
        valor: String(resultados.totalQuestoesIncorretas),
        icone: 'pi pi-times',
        acento: 'perigo',
      },
      {
        titulo: 'Tempo Total',
        valor: this.tempoFormatado(),
        icone: 'pi pi-clock',
        acento: 'alerta',
      },
      {
        titulo: 'Tempo Médio por Questão',
        valor: this.tempoMedioFormatado(),
        icone: 'pi pi-stopwatch',
        acento: 'info',
      },
      {
        titulo: 'Melhor Sequência',
        valor: `${this.melhorSequenciaAcertos()} acerto(s)`,
        icone: 'pi pi-bolt',
        acento: 'sucesso',
      },
    ];
  });
}
