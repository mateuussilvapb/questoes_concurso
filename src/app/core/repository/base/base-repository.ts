import { Table } from 'dexie';

import { AppDatabase } from '../../database/app.database';
import { MetadataResolver } from '../../database/resolver/metadata-resolver';
import { RepositoryPredicate } from '../interfaces/repository-predicate';
import { QueryBuilder } from '../query/query-builder';
import { EntityRepository } from './entity-repository';

export abstract class BaseRepository<T extends object> implements EntityRepository<T> {
  protected readonly table: Table<any, string>;

  constructor(
    protected readonly database: AppDatabase,
    protected readonly tableName: string,
    protected readonly entityType: Function,
  ) {
    this.table = database.table(tableName) as Table<T, string>;
  }

  async findAll(): Promise<T[]> {
    return this.hydrateAll(await this.table.toArray());
  }

  async findById(id: string): Promise<T | undefined> {
    return this.hydrate(await this.table.get(id));
  }

  async findByIds(ids: string[]): Promise<T[]> {
    const result = await this.table.bulkGet(ids);

    return this.hydrateAll(result.filter((item): item is T => item !== undefined));
  }

  async findByPredicate(predicate: RepositoryPredicate<T>): Promise<T[]> {
    return this.hydrateAll(await this.table.filter(predicate).toArray());
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

    return this.hydrateAll(
      await collection
        .offset(page * size)
        .limit(size)
        .toArray(),
    );
  }

  async findOne(predicate: RepositoryPredicate<T>): Promise<T | undefined> {
    return this.hydrate(await this.table.filter(predicate).first());
  }

  async first(predicate?: RepositoryPredicate<T>): Promise<T | undefined> {
    if (!predicate) {
      return this.hydrate(await this.table.toCollection().first());
    }

    return this.hydrate(await this.table.filter(predicate).first());
  }

  async last(predicate?: RepositoryPredicate<T>): Promise<T | undefined> {
    if (!predicate) {
      return this.hydrate(await this.table.toCollection().last());
    }

    return this.hydrate(await this.table.filter(predicate).last());
  }

  /**
   * O IndexedDB (via Dexie) desserializa registros como objetos planos,
   * sem a prototype chain da entidade — métodos como `touch()` não existem
   * no objeto retornado. Reanexamos o prototype da classe original sem
   * reexecutar o construtor (evita regerar `id`/`dataCriacao`).
   */
  private hydrate(raw: T | undefined): T | undefined {
    if (!raw) {
      return raw;
    }

    return Object.setPrototypeOf(raw, this.entityType.prototype);
  }

  private hydrateAll(raw: T[]): T[] {
    return raw.map((item) => this.hydrate(item)!);
  }

  async exists(value: string | RepositoryPredicate<T>): Promise<boolean> {
    if (typeof value === 'string') {
      return (await this.table.get(value)) !== undefined;
    }

    return (await this.table.filter(value).count()) > 0;
  }

  async save(entity: T): Promise<T> {
    await this.table.put(entity);

    return entity;
  }

  async saveAll(entities: T[]): Promise<void> {
    await this.table.bulkPut(entities);
  }

  async update(id: string, changes: Partial<T>): Promise<void> {
    await this.table.update(id, changes);
  }

  async updateAll(ids: string[], changes: Partial<T>): Promise<void> {
    // Tipagem estrutural mínima: o tipo real de Dexie.transaction() (overloads
    // com TXWithTables<this>) causa TS2589 (recursão de tipo excessiva) neste
    // contexto genérico.
    const database: { transaction: Function } = this.database;

    await database.transaction('rw', this.tableName, async () => {
      await Promise.all(ids.map((id) => this.table.update(id, changes)));
    });
  }

  async delete(id: string): Promise<void> {
    await this.table.delete(id);
  }

  async deleteAll(ids: string[]): Promise<void> {
    await this.table.bulkDelete(ids);
  }

  async clear(): Promise<void> {
    await this.table.clear();
  }

  async count(predicate?: RepositoryPredicate<T>): Promise<number> {
    if (!predicate) {
      return this.table.count();
    }

    return this.table.filter(predicate).count();
  }

  query(): QueryBuilder<T> {
    return new QueryBuilder(this.table, MetadataResolver.resolve(this.entityType));
  }
}
