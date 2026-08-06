//Angular
import { Injectable } from '@angular/core';

//Aplicação
import { BaseEntity } from '../../../../shared/models/base-entity';
import { BackupData } from '../../../../core/storage/backup.models';
import { Materia } from '../../../materias/core/models/materia.model';
import { Assunto } from '../../../assuntos/core/models/assunto.model';
import { Banca } from '../../../bancas/core/models/banca.model';
import { Questao } from '../../../questoes/core/models/questao.model';
import { BACKUP_VERSION } from '../../../../shared/types/types-const';
import { HistoricoQuestao } from '../../../historico/core/models/historico-questao.model';

/**
 * Versões de backup ainda aceitas na importação, além da versão atual.
 * Versão 1 não tinha o campo `bancas` — o BackupService normaliza o
 * arquivo (preenchendo `bancas: []`) antes de chamar `validate()`.
 */
const VERSOES_LEGADAS_SUPORTADAS = [1];

@Injectable({
  providedIn: 'root',
})
export class BackupValidatorService {
  validate(backup: BackupData): void {
    this.validateStructure(backup);

    this.validateEntities(backup.materias, 'Matéria');
    this.validateEntities(backup.assuntos, 'Assunto');
    this.validateEntities(backup.bancas, 'Banca');
    this.validateEntities(backup.questoes, 'Questão');
    this.validateEntities(backup.historicos, 'Histórico');

    this.validateDuplicateIds(backup.materias, 'Matéria');
    this.validateDuplicateIds(backup.assuntos, 'Assunto');
    this.validateDuplicateIds(backup.bancas, 'Banca');
    this.validateDuplicateIds(backup.questoes, 'Questão');
    this.validateDuplicateIds(backup.historicos, 'Histórico');

    this.validateRelations(
      backup.materias,
      backup.assuntos,
      backup.bancas,
      backup.questoes,
      backup.historicos,
    );
  }

  private validateStructure(backup: BackupData): void {
    if (!backup) {
      throw new Error('Backup inválido.');
    }

    const versaoSuportada =
      backup.versao === BACKUP_VERSION || VERSOES_LEGADAS_SUPORTADAS.includes(backup.versao);

    if (!versaoSuportada) {
      throw new Error('Versão do backup incompatível.');
    }

    if (typeof backup.exportadoEm !== 'string' && Number.isNaN(Date.parse(backup.exportadoEm))) {
      throw new Error('Data de exportação inválida.');
    }

    if (!Array.isArray(backup.materias)) {
      throw new Error('Matérias inválidas.');
    }

    if (!Array.isArray(backup.assuntos)) {
      throw new Error('Assuntos inválidos.');
    }

    if (!Array.isArray(backup.bancas)) {
      throw new Error('Bancas inválidas.');
    }

    if (!Array.isArray(backup.questoes)) {
      throw new Error('Questões inválidas.');
    }

    if (!Array.isArray(backup.historicos)) {
      throw new Error('Históricos inválidos.');
    }
  }

  private validateDuplicateIds(entities: BaseEntity[], entityName: string): void {
    const ids = new Set<string>();

    for (const entity of entities) {
      if (ids.has(entity.id)) {
        throw new Error(`${entityName} duplicada: ${entity.id}.`);
      }

      ids.add(entity.id);
    }
  }

  private validateEntities(entities: BaseEntity[], entityName: string): void {
    for (const entity of entities) {
      if (typeof entity.id !== 'string' || entity.id.trim() === '') {
        throw new Error(`${entityName} sem id.`);
      }

      if (typeof entity.dataCriacao !== 'string') {
        throw new Error(`${entityName} ${entity.id} sem data de criação.`);
      }
    }
  }

  private validateRelations(
    materias: Materia[],
    assuntos: Assunto[],
    bancas: Banca[],
    questoes: Questao[],
    historicos: HistoricoQuestao[],
  ): void {
    const materiaIds = new Set(materias.map((m) => m.id));
    const assuntoIds = new Set(assuntos.map((a) => a.id));
    const bancaIds = new Set(bancas.map((b) => b.id));
    const questaoIds = new Set(questoes.map((q) => q.id));

    for (const assunto of assuntos) {
      this.validateReference('Assunto', assunto.id, 'Matéria', assunto.idMateria, materiaIds);
    }

    for (const questao of questoes) {
      this.validateReference('Questão', questao.id, 'Assunto', questao.idsAssuntos, assuntoIds);

      if (questao.idBanca) {
        this.validateReference('Questão', questao.id, 'Banca', questao.idBanca, bancaIds);
      }
    }

    for (const historico of historicos) {
      this.validateReference('Histórico', historico.id, 'Questão', historico.idQuestao, questaoIds);
    }
  }

  private validateReference(
    sourceName: string,
    sourceId: string,
    targetName: string,
    targetId: string | string[],
    validIds: Set<string>,
  ): void {
    let references: string[];

    if (Array.isArray(targetId)) {
      references = targetId.filter(Boolean);
    } else if (targetId) {
      references = [targetId];
    } else {
      references = [];
    }

    for (const id of references) {
      if (!validIds.has(id)) {
        throw new Error(`${sourceName} ${sourceId} referencia ${targetName} inexistente (${id}).`);
      }
    }
  }
}
