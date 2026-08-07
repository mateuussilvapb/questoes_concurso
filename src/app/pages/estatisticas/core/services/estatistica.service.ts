//Angular
import { Injectable, inject } from '@angular/core';

//Aplicação
import { HistoricoQuestao } from '../../../historico/core/models/historico-questao.model';
import { HistoricoService } from '../../../historico/core/services/historico.service';
import { MateriaService } from '../../../materias/core/services/materia.service';
import { AssuntoService } from '../../../assuntos/core/services/assunto.service';
import {
  NivelDificuldade,
  NIVEL_DIFICULDADE_LABEL,
} from '../../../questoes/core/enums/nivel-dificuldade.enum';
import { EstatisticaFilter } from '../dtos/estatistica-filter.dto';
import { GranularidadeTemporal } from '../enums/granularidade-temporal.enum';
import {
  FAIXA_TEMPO_RESPOSTA_LABEL,
  FaixaTempoResposta,
  LIMITES_FAIXA_TEMPO,
} from '../enums/faixa-tempo-resposta.enum';
import { TipoAgrupamento } from '../enums/tipo-agrupamento.enum';
import { DesempenhoPorGrupo } from '../models/desempenho-grupo.model';
import { DesempenhoPorFaixaTempo } from '../models/desempenho-tempo.model';
import { PontoEvolucao } from '../models/ponto-evolucao.model';
import { EstatisticasResumo } from '../models/estatisticas-resumo.model';
import { PainelEstatisticas } from '../models/painel-estatisticas.model';
import { DataEstatistica } from '../shared/data-estatistica';
import {
  BaseEstatistica,
  ContextoEstatistica,
  LABEL_ASSUNTO_REMOVIDO,
  LABEL_MATERIA_REMOVIDA,
  LABEL_SEM_ASSUNTO,
  LABEL_SEM_MATERIA,
  MAX_BUCKETS_SERIE,
  MINIMO_QUESTOES_RELEVANCIA,
  TAMANHO_RANKING_PONTOS_FRACOS,
} from '../shared/contexto-estatistica';

interface FilterStrategy {
  isValid: (value: any) => boolean;
  createPredicate: (value: any) => (h: HistoricoQuestao) => boolean;
}

const FILTER_STRATEGIES: Record<keyof EstatisticaFilter, FilterStrategy> = {
  idMateria: {
    isValid: (val) => !!val,
    createPredicate: (val) => (h) => h.idMateria === val,
  },
  idsAssuntos: {
    isValid: (val) => !!val?.length,
    createPredicate: (val) => (h) => val.some((id: string) => h.idsAssuntos.includes(id)),
  },
  dificuldade: {
    isValid: (val) => val !== null && val !== undefined,
    createPredicate: (val) => (h) => h.dificuldade === val,
  },
  dataInicioPeriodoConsulta: {
    isValid: (val) => !!val && !Number.isNaN(new Date(val).getTime()),
    createPredicate: (val) => (h) => new Date(h.respondidaEm).getTime() >= new Date(val).getTime(),
  },
  dataFimPeriodoConsulta: {
    isValid: (val) => !!val && !Number.isNaN(new Date(val).getTime()),
    createPredicate: (val) => (h) =>
      new Date(h.respondidaEm).getTime() <= DataEstatistica.fimDoDia(new Date(val)).getTime(),
  },
  granularidade: {
    isValid: () => false,
    createPredicate: () => () => true,
  },
};

interface Acumulador {
  idGrupo: string;
  total: number;
  corretas: number;
  tempoTotal: number;
}

@Injectable({
  providedIn: 'root',
})
export class EstatisticaService {
  private readonly historicoService = inject(HistoricoService);
  private readonly materiaService = inject(MateriaService);
  private readonly assuntoService = inject(AssuntoService);

  // ======================================================
  // CARGA  (única operação assíncrona da tela)
  // ======================================================

  async carregarBase(): Promise<BaseEstatistica> {
    const [historicos, materias, assuntos] = await Promise.all([
      this.historicoService.listar(),
      this.materiaService.listar(),
      this.assuntoService.listar(),
    ]);

    return {
      historicos,
      contexto: {
        nomesMateria: new Map(materias.map((m) => [m.id, m.nome])),
        nomesAssunto: new Map(assuntos.map((a) => [a.id, a.nome])),
      },
    };
  }

  // ======================================================
  // CONSULTAS  (síncronas e puras)
  // ======================================================

  filtrar(historicos: HistoricoQuestao[], filtro: EstatisticaFilter): HistoricoQuestao[] {
    const activeFilter = filtro ?? ({} as EstatisticaFilter);

    const predicates = Object.keys(activeFilter)
      .map((key) => {
        const filterKey = key as keyof EstatisticaFilter;
        const strategy = FILTER_STRATEGIES[filterKey];
        const value = activeFilter[filterKey];

        return strategy?.isValid(value) ? strategy.createPredicate(value) : null;
      })
      .filter((predicate): predicate is (h: HistoricoQuestao) => boolean => !!predicate);

    return historicos.filter((h) => predicates.every((predicate) => predicate(h)));
  }

  /** Sugere a granularidade a usar para não estourar MAX_BUCKETS_SERIE. Página decide se promove. */
  sugerirGranularidade(
    historicos: HistoricoQuestao[],
    granularidadeSolicitada: GranularidadeTemporal,
  ): GranularidadeTemporal {
    const { min, max } = this.obterExtremos(historicos);

    if (min === null || max === null) {
      return granularidadeSolicitada;
    }

    if (granularidadeSolicitada !== GranularidadeTemporal.DIA) {
      return granularidadeSolicitada;
    }

    const dias = DataEstatistica.diasEntre(min, max) + 1;

    if (dias <= MAX_BUCKETS_SERIE) {
      return GranularidadeTemporal.DIA;
    }

    return dias / 7 <= MAX_BUCKETS_SERIE ? GranularidadeTemporal.SEMANA : GranularidadeTemporal.MES;
  }

  montarPainel(
    historicos: HistoricoQuestao[],
    contexto: ContextoEstatistica,
    granularidade: GranularidadeTemporal,
  ): PainelEstatisticas {
    const porMateria = new Map<string, Acumulador>();
    const porAssunto = new Map<string, Acumulador>();
    const porDificuldade = new Map<string, Acumulador>();
    const porBucket = new Map<string, Acumulador>();
    const porFaixaTempo = new Map<string, Acumulador>();
    const diasDistintos = new Set<string>();

    let total = 0;
    let corretas = 0;
    let tempoTotal = 0;

    for (const h of historicos) {
      const momento = new Date(h.respondidaEm).getTime();
      if (Number.isNaN(momento)) continue; // registro corrompido de backup restaurado

      total++;
      if (h.correta) corretas++;
      tempoTotal += h.tempoResposta ?? 0;

      this.acumular(porMateria, h.idMateria ?? '', h);
      this.acumular(porDificuldade, String(h.dificuldade), h);
      this.acumular(porBucket, DataEstatistica.chaveBucket(new Date(momento), granularidade), h);
      this.acumular(porFaixaTempo, String(this.resolverFaixa(h.tempoResposta)), h);

      for (const id of h.idsAssuntos?.length ? h.idsAssuntos : ['']) {
        this.acumular(porAssunto, id, h);
      }

      diasDistintos.add(DataEstatistica.chaveDia(new Date(momento)));
    }

    const resumo = this.montarResumo(total, corretas, tempoTotal, diasDistintos, historicos);
    const evolucao = this.montarEvolucao(historicos, granularidade);

    const materiaGrupos = this.materializar(porMateria, TipoAgrupamento.MATERIA, contexto);
    const assuntoGrupos = this.materializar(porAssunto, TipoAgrupamento.ASSUNTO, contexto);
    const dificuldadeGrupos = this.completarTodasDificuldades(
      this.materializar(porDificuldade, TipoAgrupamento.DIFICULDADE, contexto),
    );

    const faixasTempo = this.montarFaixasTempo(porFaixaTempo, total);

    return {
      resumo,
      evolucao,
      porMateria: materiaGrupos,
      porAssunto: assuntoGrupos,
      porDificuldade: dificuldadeGrupos,
      pontosFracosMateria: this.montarPontosFracos(materiaGrupos),
      pontosFracosAssunto: this.montarPontosFracos(assuntoGrupos),
      faixasTempo,
      vazio: total === 0,
    };
  }

  // ======================================================
  // HELPERS
  // ======================================================

  private acumular(mapa: Map<string, Acumulador>, chave: string, h: HistoricoQuestao): void {
    const atual = mapa.get(chave) ?? { idGrupo: chave, total: 0, corretas: 0, tempoTotal: 0 };
    atual.total++;
    if (h.correta) atual.corretas++;
    atual.tempoTotal += h.tempoResposta ?? 0;
    mapa.set(chave, atual);
  }

  private materializar(
    mapa: Map<string, Acumulador>,
    tipo: TipoAgrupamento,
    contexto: ContextoEstatistica,
  ): DesempenhoPorGrupo[] {
    return [...mapa.values()].map((acumulador) => {
      const { nome, orfao } = this.resolverNomeGrupo(tipo, acumulador.idGrupo, contexto);

      return {
        idGrupo: acumulador.idGrupo,
        nomeGrupo: nome,
        tipo,
        orfao,
        totalRespondidas: acumulador.total,
        totalCorretas: acumulador.corretas,
        totalIncorretas: acumulador.total - acumulador.corretas,
        aproveitamento: this.calcularAproveitamento(acumulador.corretas, acumulador.total),
        tempoMedioResposta: acumulador.total > 0 ? acumulador.tempoTotal / acumulador.total : null,
        tempoTotal: acumulador.tempoTotal,
      };
    });
  }

  private resolverNomeGrupo(
    tipo: TipoAgrupamento,
    idGrupo: string,
    contexto: ContextoEstatistica,
  ): { nome: string; orfao: boolean } {
    if (tipo === TipoAgrupamento.DIFICULDADE) {
      const dificuldade = Number(idGrupo) as NivelDificuldade;
      return { nome: NIVEL_DIFICULDADE_LABEL[dificuldade] ?? idGrupo, orfao: false };
    }

    if (tipo === TipoAgrupamento.MATERIA) {
      if (!idGrupo) return { nome: LABEL_SEM_MATERIA, orfao: true };

      const nome = contexto.nomesMateria.get(idGrupo);
      return nome ? { nome, orfao: false } : { nome: LABEL_MATERIA_REMOVIDA, orfao: true };
    }

    // ASSUNTO
    if (!idGrupo) return { nome: LABEL_SEM_ASSUNTO, orfao: true };

    const nome = contexto.nomesAssunto.get(idGrupo);
    return nome ? { nome, orfao: false } : { nome: LABEL_ASSUNTO_REMOVIDO, orfao: true };
  }

  private completarTodasDificuldades(grupos: DesempenhoPorGrupo[]): DesempenhoPorGrupo[] {
    const porId = new Map(grupos.map((g) => [g.idGrupo, g]));

    return Object.values(NivelDificuldade)
      .filter((v): v is NivelDificuldade => typeof v === 'number')
      .sort((a, b) => a - b)
      .map(
        (dificuldade) =>
          porId.get(String(dificuldade)) ?? {
            idGrupo: String(dificuldade),
            nomeGrupo: NIVEL_DIFICULDADE_LABEL[dificuldade],
            tipo: TipoAgrupamento.DIFICULDADE,
            orfao: false,
            totalRespondidas: 0,
            totalCorretas: 0,
            totalIncorretas: 0,
            aproveitamento: null,
            tempoMedioResposta: null,
            tempoTotal: 0,
          },
      );
  }

  private montarPontosFracos(grupos: DesempenhoPorGrupo[]): DesempenhoPorGrupo[] {
    return grupos
      .filter(
        (g) =>
          !g.orfao && g.totalRespondidas >= MINIMO_QUESTOES_RELEVANCIA && g.aproveitamento !== null,
      )
      .sort(
        (a, b) => a.aproveitamento! - b.aproveitamento! || b.totalRespondidas - a.totalRespondidas,
      )
      .slice(0, TAMANHO_RANKING_PONTOS_FRACOS);
  }

  private resolverFaixa(tempoResposta: number): FaixaTempoResposta {
    const tempo = Math.max(0, tempoResposta ?? 0);
    return LIMITES_FAIXA_TEMPO.find((f) => tempo < f.limite)!.faixa;
  }

  private montarFaixasTempo(
    porFaixaTempo: Map<string, Acumulador>,
    totalGeral: number,
  ): DesempenhoPorFaixaTempo[] {
    return LIMITES_FAIXA_TEMPO.map(({ faixa }) => {
      const acumulador = porFaixaTempo.get(String(faixa));
      const total = acumulador?.total ?? 0;
      const corretas = acumulador?.corretas ?? 0;

      return {
        faixa,
        label: FAIXA_TEMPO_RESPOSTA_LABEL[faixa],
        totalRespondidas: total,
        totalCorretas: corretas,
        aproveitamento: this.calcularAproveitamento(corretas, total),
        participacao: totalGeral > 0 ? total / totalGeral : null,
      };
    });
  }

  private montarResumo(
    total: number,
    corretas: number,
    tempoTotal: number,
    diasDistintos: Set<string>,
    historicos: HistoricoQuestao[],
  ): EstatisticasResumo {
    const { min, max } = this.obterExtremos(historicos);
    const sequencias = this.calcularSequencias(diasDistintos);

    return {
      totalRespondidas: total,
      totalCorretas: corretas,
      totalIncorretas: total - corretas,
      aproveitamento: this.calcularAproveitamento(corretas, total),
      tempoMedioResposta: total > 0 ? tempoTotal / total : null,
      tempoTotalEstudo: tempoTotal,
      diasEstudados: diasDistintos.size,
      mediaQuestoesPorDia: diasDistintos.size > 0 ? total / diasDistintos.size : null,
      sequenciaAtualDias: sequencias.atual,
      sequenciaRecordeDias: sequencias.recorde,
      primeiraRespostaEm: min === null ? null : new Date(min).toISOString(),
      ultimaRespostaEm: max === null ? null : new Date(max).toISOString(),
    };
  }

  private montarEvolucao(
    historicos: HistoricoQuestao[],
    granularidade: GranularidadeTemporal,
  ): PontoEvolucao[] {
    const { min, max } = this.obterExtremos(historicos);
    if (min === null || max === null) return [];

    const porBucket = new Map<string, Acumulador>();
    for (const h of historicos) {
      const momento = new Date(h.respondidaEm).getTime();
      if (Number.isNaN(momento)) continue;

      this.acumular(porBucket, DataEstatistica.chaveBucket(new Date(momento), granularidade), h);
    }

    const pontos: PontoEvolucao[] = [];
    let cursor = DataEstatistica.inicioBucket(new Date(min), granularidade);
    const fimBucket = DataEstatistica.inicioBucket(new Date(max), granularidade);

    let acumuladoTotal = 0;
    let acumuladoCorretas = 0;

    while (cursor.getTime() <= fimBucket.getTime()) {
      const chave = DataEstatistica.chaveBucket(cursor, granularidade);
      const acumulador = porBucket.get(chave);
      const totalBucket = acumulador?.total ?? 0;
      const corretasBucket = acumulador?.corretas ?? 0;

      acumuladoTotal += totalBucket;
      acumuladoCorretas += corretasBucket;

      pontos.push({
        chave,
        label: DataEstatistica.formatarLabel(cursor, granularidade),
        inicio: new Date(cursor),
        granularidade,
        totalRespondidas: totalBucket,
        totalCorretas: corretasBucket,
        aproveitamento: this.calcularAproveitamento(corretasBucket, totalBucket),
        aproveitamentoAcumulado: this.calcularAproveitamento(acumuladoCorretas, acumuladoTotal),
      });

      cursor = DataEstatistica.avancarBucket(cursor, granularidade);
    }

    return pontos;
  }

  private calcularSequencias(diasDistintos: Set<string>): { atual: number; recorde: number } {
    const dias = [...diasDistintos].sort(); // 'yyyy-MM-dd' ordena lexicograficamente
    if (!dias.length) return { atual: 0, recorde: 0 };

    const emMs = dias.map((d) => DataEstatistica.deChaveDia(d).getTime());

    let recorde = 1;
    let corrente = 1;
    for (let i = 1; i < emMs.length; i++) {
      corrente = DataEstatistica.diasEntre(emMs[i - 1], emMs[i]) === 1 ? corrente + 1 : 1;
      recorde = Math.max(recorde, corrente);
    }

    const hoje = DataEstatistica.inicioDoDia(new Date()).getTime();
    const ultimo = emMs[emMs.length - 1];
    const distancia = DataEstatistica.diasEntre(ultimo, hoje);
    const atual = distancia <= 1 ? corrente : 0;

    return { atual, recorde };
  }

  private calcularAproveitamento(corretas: number, total: number): number | null {
    return total === 0 ? null : corretas / total;
  }

  private obterExtremos(historicos: HistoricoQuestao[]): {
    min: number | null;
    max: number | null;
  } {
    let min: number | null = null;
    let max: number | null = null;

    for (const h of historicos) {
      const momento = new Date(h.respondidaEm).getTime();
      if (Number.isNaN(momento)) continue;

      if (min === null || momento < min) min = momento;
      if (max === null || momento > max) max = momento;
    }

    return { min, max };
  }
}
