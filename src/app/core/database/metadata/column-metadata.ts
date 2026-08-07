export interface ColumnMetadata {
  property: string;
  reflectedType?: Function;
  primaryKey: boolean;
  autoIncrement: boolean;
  indexed: boolean;
  unique: boolean;
  multiEntry: boolean;
}
