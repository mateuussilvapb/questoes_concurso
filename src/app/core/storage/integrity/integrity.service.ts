//Angular
import { Injectable, inject } from '@angular/core';

//Aplicação
import { StorageService } from '../storage.service';
import { StorageCollection } from '../storage.constants';
import { DeleteValidationResult } from './integrity.models';
import { Questao } from '../../../pages/questoes/core/models/questao.model';
import { HistoricoQuestao } from '../../../pages/historico/core/models/historico-questao.model';
import { AssuntoRepository } from '../../repository/repositories/assunto-repository/assunto.repository';
import { AssuntoEntity } from '../../database/entities/assunto-entity';

@Injectable({
  providedIn: 'root',
})
export class IntegrityService {
  private readonly storage = inject(StorageService);
  private readonly assuntoRepository = inject(AssuntoRepository);

  // ==========================================================
  // MATÉRIA
  // ==========================================================

  async validarExclusaoMateria(idMateria: string): Promise<DeleteValidationResult> {
    const assuntos = await this.obterAssuntosDaMateria(idMateria);

    if (assuntos.length > 0) {
      return {
        canDelete: false,
        message: 'A matéria possui assuntos cadastrados.',
        dependencies: {
          assuntos: assuntos.length,
        },
      };
    }

    return {
      canDelete: true,
    };
  }

  // ==========================================================
  // ASSUNTO
  // ==========================================================

  validarExclusaoAssunto(idAssunto: string): DeleteValidationResult {
    const questoes = this.obterQuestoesDoAssunto(idAssunto);

    if (questoes.length > 0) {
      return {
        canDelete: false,
        message: 'O assunto está sendo utilizado por questões.',
        dependencies: {
          questoes: questoes.length,
        },
      };
    }

    return {
      canDelete: true,
    };
  }

  // ==========================================================
  // BANCA
  // ==========================================================

  validarExclusaoBanca(idBanca: string): DeleteValidationResult {
    const questoes = this.obterQuestoesDaBanca(idBanca);

    if (questoes.length > 0) {
      return {
        canDelete: false,
        message: 'A banca está sendo utilizada por questões.',
        dependencies: {
          questoes: questoes.length,
        },
      };
    }

    return {
      canDelete: true,
    };
  }

  // ==========================================================
  // QUESTÃO
  // ==========================================================

  validarExclusaoQuestao(idQuestao: string): DeleteValidationResult {
    const historicos = this.obterHistoricosDaQuestao(idQuestao);

    return {
      canDelete: true,
      dependencies: {
        historicos: historicos.length,
      },
    };
  }

  /**
   * Remove todos os históricos
   * pertencentes à questão.
   */
  removerHistoricosDaQuestao(idQuestao: string): number {
    const historicos = this.storage.getAll<HistoricoQuestao>(StorageCollection.HISTORICOS);

    const restantes = historicos.filter((h) => h.idQuestao !== idQuestao);

    const removidos = historicos.length - restantes.length;

    this.storage.replaceCollection(StorageCollection.HISTORICOS, restantes);

    return removidos;
  }

  // ==========================================================
  // CONSULTAS
  // ==========================================================

  async obterAssuntosDaMateria(idMateria: string): Promise<AssuntoEntity[]> {
    return this.assuntoRepository.findByPredicate((a) => a.idMateria === idMateria);
  }

  obterQuestoesDaMateria(idMateria: string): Questao[] {
    return this.storage
      .getAll<Questao>(StorageCollection.QUESTOES)
      .filter((q) => q.idMateria === idMateria);
  }

  obterQuestoesDoAssunto(idAssunto: string): Questao[] {
    return this.storage
      .getAll<Questao>(StorageCollection.QUESTOES)
      .filter((q) => q.idsAssuntos.includes(idAssunto));
  }

  obterQuestoesDaBanca(idBanca: string): Questao[] {
    return this.storage
      .getAll<Questao>(StorageCollection.QUESTOES)
      .filter((q) => q.idBanca === idBanca);
  }

  obterHistoricosDaQuestao(idQuestao: string): HistoricoQuestao[] {
    return this.storage
      .getAll<HistoricoQuestao>(StorageCollection.HISTORICOS)
      .filter((h) => h.idQuestao === idQuestao);
  }

  // ==========================================================
  // HELPERS
  // ==========================================================

  async possuiAssuntos(idMateria: string): Promise<boolean> {
    return (await this.obterAssuntosDaMateria(idMateria)).length > 0;
  }

  possuiQuestoes(idAssunto: string): boolean {
    return this.obterQuestoesDoAssunto(idAssunto).length > 0;
  }

  possuiQuestoesBanca(idBanca: string): boolean {
    return this.obterQuestoesDaBanca(idBanca).length > 0;
  }

  possuiHistoricos(idQuestao: string): boolean {
    return this.obterHistoricosDaQuestao(idQuestao).length > 0;
  }
}
