import { RepositoryPredicate } from '../interfaces/repository-predicate';

export interface EntityRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | undefined>;
  findByIds(ids: string[]): Promise<T[]>;
  findByPredicate(predicate: RepositoryPredicate<T>): Promise<T[]>;
  findPaginated(page: number, size: number, predicate?: RepositoryPredicate<T>): Promise<T[]>;
  findOne(predicate: RepositoryPredicate<T>): Promise<T | undefined>;
  first(): Promise<T | undefined>;
  first(predicate: RepositoryPredicate<T>): Promise<T | undefined>;
  last(): Promise<T | undefined>;
  last(predicate: RepositoryPredicate<T>): Promise<T | undefined>;
  exists(id: string): Promise<boolean>;
  exists(predicate: RepositoryPredicate<T>): Promise<boolean>;
  save(entity: T): Promise<T>;
  saveAll(entities: T[]): Promise<void>;
  update(id: string, changes: Partial<T>): Promise<void>;
  updateAll(ids: string[], changes: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
  deleteAll(ids: string[]): Promise<void>;
  clear(): Promise<void>;
  count(): Promise<number>;
  count(predicate: RepositoryPredicate<T>): Promise<number>;
}
