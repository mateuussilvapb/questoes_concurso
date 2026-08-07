import { ColumnMetadata } from './column-metadata';

export interface EntityMetadata {
  target: Function;
  table?: string;
  columns: ColumnMetadata[];
}
