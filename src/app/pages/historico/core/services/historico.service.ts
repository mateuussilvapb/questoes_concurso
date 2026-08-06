//Angular
import { Injectable, inject } from '@angular/core';

//Aplicação
import { HistoricoQuestao } from '../models/historico-questao.model';
import { HistoricoFilter } from '../dtos/historico-filter.dto';
import { CreateHistoricoQuestao } from '../dtos/create-historico.dto';
import { UpdateHistoricoQuestao } from '../dtos/update-historico.dto';
import { SIM_NAO_BOOLEAN } from '../../../../shared/enums/sim-nao.enum';
import { HistoricoValidatorService } from './historico-validator.service';
import { HistoricoEntity } from '../../../../core/database/entities/historico-entity';
import { HistoricoRepository } from '../../../../core/repository/repositories/historico-repository/historico.repository';
import { LoadingOverlayService } from '../../../../shared/services/loading-overlay.service';

interface FilterStrategy {
  isValid: (value: any) => boolean;
  createPredicate: (value: any) => (h: HistoricoQuestao) => boolean;
}

const FILTER_STRATEGIES: Record<keyof HistoricoFilter, FilterStrategy> = {
  idQuestao: {
    isValid: (val) => !!val,
    createPredicate: (val) => (h) => h.idQuestao === val,
  },
  idMateria: {
    isValid: (val) => !!val,
    createPredicate: (val) => (h) => h.idMateria === val,
  },
  dificuldade: {
    isValid: (val) => !!val,
    createPredicate: (val) => (h) => h.dificuldade === val,
  },
  idsAssuntos: {
    isValid: (val) => !!val?.length,
    createPredicate: (val) => (h) => val.some((id: string) => h.idsAssuntos.includes(id)),
  },
  dataInicioPeriodoConsulta: {
    isValid: (val) => !!val && !Number.isNaN(new Date(val).getTime()),
    createPredicate: (val) => (h) => new Date(h.respondidaEm).getTime() >= new Date(val).getTime(),
  },
  dataFimPeriodoConsulta: {
    isValid: (val) => !!val && !Number.isNaN(new Date(val).getTime()),
    createPredicate: (val) => (h) => new Date(h.respondidaEm).getTime() <= new Date(val).getTime(),
  },
  correta: {
    isValid: (val) =>
      val !== undefined && val !== null && (typeof val === 'boolean' || typeof val === 'number'),
    createPredicate: (val) => {
      const target = typeof val === 'boolean' ? val : (SIM_NAO_BOOLEAN as any)[val];
      return (h) => h.correta === target;
    },
  },
};

@Injectable({
  providedIn: 'root',
})
export class HistoricoService {
  private readonly repository = inject(HistoricoRepository);
  private readonly validator = inject(HistoricoValidatorService);
  private readonly loadingOverlay = inject(LoadingOverlayService);

  // ======================================================
  // CRUD
  // ======================================================

  async listar(): Promise<HistoricoQuestao[]> {
    return this.loadingOverlay.wrap(async () => {
      const historicos = await this.repository.findAll();

      return this.ordenar(historicos).map((h) => this.mapToModel(h));
    });
  }

  async buscarPorId(id: string): Promise<HistoricoQuestao> {
    return this.loadingOverlay.wrap(async () => {
      const historico = await this.buscarEntidadePorId(id);

      return this.mapToModel(historico);
    });
  }

  async criar(dto: CreateHistoricoQuestao): Promise<HistoricoQuestao> {
    return this.loadingOverlay.wrap(async () => {
      await this.validator.validarCriacao(dto);

      const entidade = new HistoricoEntity();

      entidade.idQuestao = dto.idQuestao;
      entidade.respondidaEm = dto.respondidaEm;
      entidade.idAlternativaSelecionada = dto.idAlternativaSelecionada;
      entidade.correta = dto.correta;
      entidade.tempoResposta = dto.tempoResposta;
      entidade.dificuldade = dto.dificuldade;
      entidade.idMateria = dto.idMateria;
      entidade.idsAssuntos = [...dto.idsAssuntos];

      const salvo = await this.repository.save(entidade);

      return this.mapToModel(salvo);
    });
  }

  async atualizar(dto: UpdateHistoricoQuestao): Promise<HistoricoQuestao> {
    return this.loadingOverlay.wrap(async () => {
      const entidade = await this.buscarEntidadePorId(dto.id);

      await this.validator.validarAtualizacao(dto);

      entidade.idQuestao = dto.idQuestao;
      entidade.respondidaEm = dto.respondidaEm;
      entidade.idAlternativaSelecionada = dto.idAlternativaSelecionada;
      entidade.correta = dto.correta;
      entidade.tempoResposta = dto.tempoResposta;
      entidade.dificuldade = dto.dificuldade;
      entidade.idMateria = dto.idMateria;
      entidade.idsAssuntos = [...dto.idsAssuntos];
      entidade.touch();

      const salvo = await this.repository.save(entidade);

      return this.mapToModel(salvo);
    });
  }

  async remover(id: string): Promise<void> {
    return this.loadingOverlay.wrap(async () => {
      await this.buscarEntidadePorId(id);

      await this.repository.delete(id);
    });
  }

  // ======================================================
  // CONSULTAS
  // ======================================================

  async pesquisar(filter?: HistoricoFilter): Promise<HistoricoQuestao[]> {
    const historicos = await this.listar();

    return this.aplicarFiltro(historicos, filter);
  }

  async listarPorQuestao(idQuestao: string): Promise<HistoricoQuestao[]> {
    return this.pesquisar({ idQuestao } as HistoricoFilter);
  }

  async existe(id: string): Promise<boolean> {
    return this.repository.exists(id);
  }

  async quantidade(): Promise<number> {
    return this.repository.count();
  }

  // ======================================================
  // HELPERS
  // ======================================================

  private async buscarEntidadePorId(id: string): Promise<HistoricoEntity> {
    const historico = await this.repository.findById(id);

    if (!historico) {
      throw new Error('Histórico não encontrado.');
    }

    return historico;
  }

  private ordenar(historicos: HistoricoEntity[]): HistoricoEntity[] {
    return [...historicos].sort((a, b) => b.dataCriacao.getTime() - a.dataCriacao.getTime());
  }

  private aplicarFiltro(
    historicos: HistoricoQuestao[],
    filter?: HistoricoFilter,
  ): HistoricoQuestao[] {
    const activeFilter = filter ?? ({} as HistoricoFilter);

    const predicates = Object.keys(activeFilter)
      .map((key) => {
        const filterKey = key as keyof HistoricoFilter;
        const strategy = FILTER_STRATEGIES[filterKey];
        const value = activeFilter[filterKey];

        return strategy?.isValid(value) ? strategy.createPredicate(value) : null;
      })
      .filter((predicate): predicate is (h: HistoricoQuestao) => boolean => !!predicate);

    return historicos.filter((h) => predicates.every((predicate) => predicate(h)));
  }

  private mapToModel(entity: HistoricoEntity): HistoricoQuestao {
    return {
      id: entity.id,
      idQuestao: entity.idQuestao,
      respondidaEm: entity.respondidaEm,
      idAlternativaSelecionada: entity.idAlternativaSelecionada,
      correta: entity.correta,
      tempoResposta: entity.tempoResposta,
      dificuldade: entity.dificuldade,
      idMateria: entity.idMateria,
      idsAssuntos: entity.idsAssuntos,
      dataCriacao: entity.dataCriacao.toISOString(),
      dataAtualizacao: entity.dataAtualizacao?.toISOString(),
    };
  }
}
