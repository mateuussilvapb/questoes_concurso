//Angular
import { Injectable, inject } from '@angular/core';

//Aplicação
import { StorageService } from '../storage.service';
import { StorageCollection } from '../storage.constants';
import { DeleteValidationResult } from './integrity.models';
import { Assunto } from '../../../pages/assuntos/core/models/assunto.model';
import { Questao } from '../../../pages/questoes/core/models/questao.model';
import { HistoricoQuestao } from '../../../pages/historico/core/models/historico-questao.model';

@Injectable({
  providedIn: 'root',
})
export class IntegrityService {
  private readonly storage = inject(StorageService);

  // ==========================================================
  // MATÉRIA
  // ==========================================================

  validarExclusaoMateria(idMateria: string): DeleteValidationResult {
    const assuntos = this.obterAssuntosDaMateria(idMateria);

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

  obterAssuntosDaMateria(idMateria: string): Assunto[] {
    return this.storage
      .getAll<Assunto>(StorageCollection.ASSUNTOS)
      .filter((a) => a.idMateria === idMateria);
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

  obterHistoricosDaQuestao(idQuestao: string): HistoricoQuestao[] {
    return this.storage
      .getAll<HistoricoQuestao>(StorageCollection.HISTORICOS)
      .filter((h) => h.idQuestao === idQuestao);
  }

  // ==========================================================
  // HELPERS
  // ==========================================================

  possuiAssuntos(idMateria: string): boolean {
    return this.obterAssuntosDaMateria(idMateria).length > 0;
  }

  possuiQuestoes(idAssunto: string): boolean {
    return this.obterQuestoesDoAssunto(idAssunto).length > 0;
  }

  possuiHistoricos(idQuestao: string): boolean {
    return this.obterHistoricosDaQuestao(idQuestao).length > 0;
  }
}
