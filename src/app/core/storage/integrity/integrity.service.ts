//Angular
import { Injectable, inject } from '@angular/core';

//Aplicação
import { DeleteValidationResult } from './integrity.models';
import { AssuntoRepository } from '../../repository/repositories/assunto-repository/assunto.repository';
import { AssuntoEntity } from '../../database/entities/assunto-entity';
import { QuestaoRepository } from '../../repository/repositories/questao-repository/questao.repository';
import { QuestaoEntity } from '../../database/entities/questao-entity';
import { HistoricoRepository } from '../../repository/repositories/historico-repository/historico.repository';
import { HistoricoEntity } from '../../database/entities/historico-entity';

@Injectable({
  providedIn: 'root',
})
export class IntegrityService {
  private readonly assuntoRepository = inject(AssuntoRepository);
  private readonly questaoRepository = inject(QuestaoRepository);
  private readonly historicoRepository = inject(HistoricoRepository);

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

  async validarExclusaoAssunto(idAssunto: string): Promise<DeleteValidationResult> {
    const questoes = await this.obterQuestoesDoAssunto(idAssunto);

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

  async validarExclusaoBanca(idBanca: string): Promise<DeleteValidationResult> {
    const questoes = await this.obterQuestoesDaBanca(idBanca);

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

  async validarExclusaoQuestao(idQuestao: string): Promise<DeleteValidationResult> {
    const historicos = await this.obterHistoricosDaQuestao(idQuestao);

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
  async removerHistoricosDaQuestao(idQuestao: string): Promise<number> {
    const historicos = await this.obterHistoricosDaQuestao(idQuestao);

    await this.historicoRepository.deleteAll(historicos.map((h) => h.id));

    return historicos.length;
  }

  // ==========================================================
  // CONSULTAS
  // ==========================================================

  async obterAssuntosDaMateria(idMateria: string): Promise<AssuntoEntity[]> {
    return this.assuntoRepository.findByPredicate((a) => a.idMateria === idMateria);
  }

  async obterQuestoesDaMateria(idMateria: string): Promise<QuestaoEntity[]> {
    return this.questaoRepository.findByPredicate((q) => q.idMateria === idMateria);
  }

  async obterQuestoesDoAssunto(idAssunto: string): Promise<QuestaoEntity[]> {
    return this.questaoRepository.findByPredicate((q) => q.idsAssuntos.includes(idAssunto));
  }

  async obterQuestoesDaBanca(idBanca: string): Promise<QuestaoEntity[]> {
    return this.questaoRepository.findByPredicate((q) => q.idBanca === idBanca);
  }

  async obterHistoricosDaQuestao(idQuestao: string): Promise<HistoricoEntity[]> {
    return this.historicoRepository.findByPredicate((h) => h.idQuestao === idQuestao);
  }

  // ==========================================================
  // HELPERS
  // ==========================================================

  async possuiAssuntos(idMateria: string): Promise<boolean> {
    return (await this.obterAssuntosDaMateria(idMateria)).length > 0;
  }

  async possuiQuestoes(idAssunto: string): Promise<boolean> {
    return (await this.obterQuestoesDoAssunto(idAssunto)).length > 0;
  }

  async possuiQuestoesBanca(idBanca: string): Promise<boolean> {
    return (await this.obterQuestoesDaBanca(idBanca)).length > 0;
  }

  async possuiHistoricos(idQuestao: string): Promise<boolean> {
    return (await this.obterHistoricosDaQuestao(idQuestao)).length > 0;
  }
}
