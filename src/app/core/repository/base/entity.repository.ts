import { UpdateSpec } from 'dexie';
import { RepositoryPredicate } from '../interfaces/repository-predicate';

export interface EntityRepository<T> {
  findAll(): Promise<T[]>;
  findByPredicate(predicate: RepositoryPredicate<T>): Promise<T[]>;
  findPaginated(page: number, size: number, predicate?: RepositoryPredicate<T>): Promise<T[]>;
  findById(id: string): Promise<T | undefined>;
  save(entity: T): Promise<T>;
  update(id: string, changes: UpdateSpec<T>): Promise<void>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}
