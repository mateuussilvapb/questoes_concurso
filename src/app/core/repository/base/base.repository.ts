import Dexie, { Table, UpdateSpec } from 'dexie';
import { EntityRepository } from './entity.repository';
import { RepositoryPredicate } from '../interfaces/repository-predicate';

export abstract class BaseRepository<T extends { id: string }> implements EntityRepository<T> {
  protected readonly table: Table<T, string>;

  constructor(
    protected readonly database: Dexie,
    tableName: string,
  ) {
    this.table = database.table<T, string>(tableName);
  }

  async findAll(): Promise<T[]> {
    return this.table.toArray();
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

  async findById(id: string): Promise<T | undefined> {
    return this.table.get(id);
  }

  async save(entity: T): Promise<T> {
    await this.table.put(entity);

    return entity;
  }

  async update(id: string, changes: UpdateSpec<T>): Promise<void> {
    await this.table.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await this.table.delete(id);
  }

  async count(): Promise<number> {
    return this.table.count();
  }
}
