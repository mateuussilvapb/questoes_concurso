import { Injectable, inject } from '@angular/core';

import { StorageCollection } from '../storage.constants';
import { StorageService } from '../storage.service';

// import { Questao } from '../../features/questoes/models/questao.model';
// import { Historico } from '../../features/historicos/models/historico.model';

import { Assunto } from '../../../pages/assuntos/core/models/assunto.model';
import { DeleteValidationResult } from './integrity.models';

@Injectable({
  providedIn: 'root',
})
export class IntegrityService {
  private readonly storage = inject(StorageService);

  // ==========================================================
  // MATÉRIA
  // ==========================================================

  validarExclusaoMateria(idMateria: string): DeleteValidationResult {
    const assuntos = this.storage
      .getAll<Assunto>(StorageCollection.ASSUNTOS)
      .filter((a) => a.idMateria === idMateria);
    if (assuntos.length > 0) {
      return {
        canDelete: false,
        message: `Não é possível excluir a matéria porque existem ${assuntos.length} assunto(s) vinculados.`,
      };
    }

    return {
      canDelete: true,
    };
  }

  // ==========================================================
  // ASSUNTO
  // ==========================================================

  //TODO
  // validarExclusaoAssunto(idAssunto: string): DeleteValidationResult {
  //   const questoes = this.storage
  //     .getAll<Questao>(StorageCollection.QUESTOES)
  //     .filter((q) => q.idsAssuntos.includes(idAssunto));

  //   if (questoes.length > 0) {
  //     return {
  //       canDelete: false,

  //       message: `Não é possível excluir o assunto porque existem ${questoes.length} questão(ões) vinculadas.`,
  //     };
  //   }

  //   return {
  //     canDelete: true,
  //   };
  // }

  // ==========================================================
  // QUESTÃO
  // ==========================================================

  validarExclusaoQuestao(idQuestao: string): DeleteValidationResult {
    return {
      canDelete: true,
    };
  }

  // ==========================================================
  // HISTÓRICO
  // ==========================================================

  //TODO
  // removerHistoricosDaQuestao(idQuestao: string): void {
  //   const historicos = this.storage
  //     .getAll<Historico>(StorageCollection.HISTORICOS)
  //     .filter((h) => h.idQuestao !== idQuestao);

  //   localStorage.setItem(StorageCollection.HISTORICOS, JSON.stringify(historicos));
  // }
}
