//Angular
import { inject, Injectable } from '@angular/core';

//Aplicação
import { HistoricoFilter } from '../dtos/historico-filter.dto';
import { HistoricoQuestao } from '../models/historico-questao.model';
import { SIM_NAO_BOOLEAN } from '../../../../shared/enums/sim-nao.enum';
import { StorageService } from '../../../../core/storage/storage.service';
import { StorageCollection } from '../../../../core/storage/storage.constants';

interface FilterStrategy {
  isValid: (value: any) => boolean;
  createPredicate: (value: any) => (q: HistoricoQuestao) => boolean;
}

export const FILTER_STRATEGIES: Record<keyof HistoricoFilter, FilterStrategy> = {
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
export class HistoricoRepository {
  private readonly storage = inject(StorageService);

  findAll(): HistoricoQuestao[] {
    return this.storage.getAll<HistoricoQuestao>(StorageCollection.HISTORICOS);
  }

  findById(id: string): HistoricoQuestao | undefined {
    return this.storage.getById<HistoricoQuestao>(StorageCollection.HISTORICOS, id);
  }

  find(filter?: HistoricoFilter): HistoricoQuestao[] {
    const activeFilter = filter ?? ({} as HistoricoFilter);
    const predicates = this.buildPredicates(activeFilter);

    return this.ordenar(
      this.findAll().filter((q) => predicates.every((predicate) => predicate(q))),
    );
  }

  private buildPredicates(filter: HistoricoFilter): Array<(q: HistoricoQuestao) => boolean> {
    return Object.keys(filter)
      .map((key) => {
        const filterKey = key as keyof HistoricoFilter;
        const strategy = FILTER_STRATEGIES[filterKey];
        const value = filter[filterKey];

        return strategy?.isValid(value) ? strategy.createPredicate(value) : null;
      })
      .filter((predicate): predicate is (q: HistoricoQuestao) => boolean => !!predicate);
  }

  private ordenar(historicos: HistoricoQuestao[]): HistoricoQuestao[] {
    return [...historicos].sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
  }

  exists(id: string): boolean {
    return this.findById(id) !== undefined;
  }

  insert(historicoQuestao: HistoricoQuestao): HistoricoQuestao {
    return this.storage.insert<HistoricoQuestao>(StorageCollection.HISTORICOS, historicoQuestao);
  }

  update(historicoQuestao: HistoricoQuestao): HistoricoQuestao {
    return this.storage.update<HistoricoQuestao>(StorageCollection.HISTORICOS, historicoQuestao);
  }

  delete(id: string): void {
    this.storage.delete(StorageCollection.HISTORICOS, id);
  }

  count(): number {
    return this.findAll().length;
  }

  save(historicoQuestao: HistoricoQuestao): HistoricoQuestao {
    if (this.exists(historicoQuestao.id)) {
      return this.update(historicoQuestao);
    }

    return this.insert(historicoQuestao);
  }
}
