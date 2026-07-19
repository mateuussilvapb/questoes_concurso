import { Table } from 'dexie';

import { AppDatabase } from '../../database/app.database'; // ajuste o caminho conforme sua estrutura
import { RepositoryPredicate } from '../interfaces/repository-predicate';
import { EntityRepository } from './entity-repository';

export abstract class BaseRepository<T extends object> implements EntityRepository<T> {
  protected readonly table: Table<any, string>;

  constructor(
    protected readonly database: AppDatabase, // <- era Dexie, agora é AppDatabase
    tableName: string,
  ) {
    this.table = database.table(tableName);
  }

  async findAll(): Promise<T[]> {
    return this.table.toArray();
  }

  async findById(id: string): Promise<T | undefined> {
    return this.table.get(id);
  }

  async findByPredicate(predicate: RepositoryPredicate<T>): Promise<T[]> {
    return this.table.filter(predicate).toArray();
  }

  async findPaginated(
    page: number,
    size: number,
    predicate?: RepositoryPredicate<T>,
  ): Promise<T[]> {
    let collection = this.table.toCollection();

    if (predicate) {
      collection = collection.filter(predicate);
    }

    return collection
      .offset(page * size)
      .limit(size)
      .toArray();
  }

  async save(entity: T): Promise<T> {
    await this.table.put(entity);

    return entity;
  }

  async update(id: string, changes: Partial<T>): Promise<void> {
    await this.table.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await this.table.delete(id);
  }

  async count(): Promise<number> {
    return this.table.count();
  }
}
