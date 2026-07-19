import { IndexMetadata } from './index-metadata';

export interface EntityMetadata {
  table: string;
  target: Function;
  primaryKey?: string;
  autoIncrement?: boolean;
  indexes: IndexMetadata[];
}
