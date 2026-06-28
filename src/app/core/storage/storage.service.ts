import { inject, Injectable } from '@angular/core';
import { StorageCollection } from './storage.constants';
import { BaseEntity } from '../../shared/models/base-entity';
import { BackupData, ImportMode, MergeResult } from './backup.models';
import { IdGeneratorService } from './id-generator/id-generator.service';
@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly backupVersion = 1;
  private readonly idGeneratorService = inject(IdGeneratorService);

  // ============================================================
  // LEITURA
  // ============================================================

  getAll<T>(collection: StorageCollection): T[] {
    const json = localStorage.getItem(collection);

    if (!json) {
      return [];
    }

    try {
      return JSON.parse(json) as T[];
    } catch {
      return [];
    }
  }

  getById<T extends BaseEntity>(collection: StorageCollection, id: string): T | undefined {
    return this.getAll<T>(collection).find((item) => item.id === id);
  }

  exists(collection: StorageCollection, id: string): boolean {
    return this.getAll<BaseEntity>(collection).some((item) => item.id === id);
  }

  // ============================================================
  // ESCRITA
  // ============================================================

  insert<T extends BaseEntity>(
    collection: StorageCollection,
    entity: Omit<T, 'id' | 'dataCriacao'>,
  ): T {
    const values = this.getAll<T>(collection);

    const saved = {
      ...entity,

      id: this.generateUniqueId(collection),

      dataCriacao: new Date().toISOString(),
    } as T;

    values.push(saved);

    this.save(collection, values);

    return saved;
  }

  update<T extends BaseEntity>(collection: StorageCollection, entity: T): T {
    const values = this.getAll<T>(collection);

    const index = values.findIndex((i) => i.id === entity.id);

    if (index < 0) {
      throw new Error(`Registro ${entity.id} não encontrado.`);
    }

    values[index] = {
      ...entity,
      dataAtualizacao: new Date().toISOString(),
    };

    this.save(collection, values);

    return entity;
  }

  delete(collection: StorageCollection, id: string): void {
    const values = this.getAll<BaseEntity>(collection).filter((item) => item.id !== id);

    this.save(collection, values);
  }

  clear(collection: StorageCollection): void {
    localStorage.removeItem(collection);
  }

  clearAll(): void {
    Object.values(StorageCollection).forEach((collection) => this.clear(collection));
  }

  replaceCollection<T>(collection: StorageCollection, values: readonly T[]): void {
    localStorage.setItem(collection, JSON.stringify(values));
  }

  removeWhere<T>(collection: StorageCollection, predicate: (item: T) => boolean): number {
    const values = this.getAll<T>(collection);

    const remaining = values.filter((item) => !predicate(item));

    this.replaceCollection(collection, remaining);

    return values.length - remaining.length;
  }

  // ============================================================
  // IDS
  // ============================================================

  generateUniqueId(collection: StorageCollection): string {
    let id: string;

    do {
      id = this.idGeneratorService.generate();
    } while (this.exists(collection, id));

    return id;
  }

  // ============================================================
  // BACKUP
  // ============================================================

  exportBackup(): BackupData {
    return {
      versao: this.backupVersion,

      exportadoEm: new Date().toISOString(),

      materias: this.getAll(StorageCollection.MATERIAS),

      assuntos: this.getAll(StorageCollection.ASSUNTOS),

      questoes: this.getAll(StorageCollection.QUESTOES),

      historicos: this.getAll(StorageCollection.HISTORICOS),
    };
  }

  importBackup(backup: BackupData, mode: ImportMode): MergeResult {
    this.validateBackup(backup);

    if (mode === ImportMode.REPLACE) {
      this.replaceAll(backup);

      return {
        materias: { imported: backup.materias.length, ignored: 0 },
        assuntos: { imported: backup.assuntos.length, ignored: 0 },
        questoes: { imported: backup.questoes.length, ignored: 0 },
        historicos: { imported: backup.historicos.length, ignored: 0 },
      };
    }

    return {
      materias: this.mergeCollection(StorageCollection.MATERIAS, backup.materias),

      assuntos: this.mergeCollection(StorageCollection.ASSUNTOS, backup.assuntos),

      questoes: this.mergeCollection(StorageCollection.QUESTOES, backup.questoes),

      historicos: this.mergeCollection(StorageCollection.HISTORICOS, backup.historicos),
    };
  }

  // ============================================================
  // PRIVADOS
  // ============================================================

  private save<T>(collection: StorageCollection, values: readonly T[]): void {
    localStorage.setItem(collection, JSON.stringify(values));
  }

  private replaceAll(backup: BackupData): void {
    this.save(StorageCollection.MATERIAS, backup.materias);

    this.save(StorageCollection.ASSUNTOS, backup.assuntos);

    this.save(StorageCollection.QUESTOES, backup.questoes);

    this.save(StorageCollection.HISTORICOS, backup.historicos);
  }

  private mergeCollection<T extends BaseEntity>(collection: StorageCollection, imported: T[]) {
    const current = this.getAll<T>(collection);

    const map = new Map<string, T>();

    current.forEach((item) => {
      map.set(item.id, item);
    });

    let importedCount = 0;

    let ignoredCount = 0;

    imported.forEach((item) => {
      if (map.has(item.id)) {
        ignoredCount++;

        return;
      }

      importedCount++;

      map.set(item.id, item);
    });

    this.save(collection, [...map.values()]);

    return {
      imported: importedCount,

      ignored: ignoredCount,
    };
  }

  private validateBackup(backup: BackupData): void {
    if (!backup) {
      throw new Error('Backup inválido.');
    }

    if (backup.versao !== this.backupVersion) {
      throw new Error('Versão do backup incompatível.');
    }

    if (!Array.isArray(backup.materias)) {
      throw new Error('Matérias inválidas.');
    }

    if (!Array.isArray(backup.assuntos)) {
      throw new Error('Assuntos inválidos.');
    }

    if (!Array.isArray(backup.questoes)) {
      throw new Error('Questões inválidas.');
    }

    if (!Array.isArray(backup.historicos)) {
      throw new Error('Históricos inválidos.');
    }
  }
}
