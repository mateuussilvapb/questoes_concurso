import { QueryLogicalOperator } from './query-logical-operator';
import { QueryOperator } from './query-operator';

export interface QueryCondition<T> {
  property: keyof T;
  operator: QueryOperator;
  value: unknown;
  secondValue?: unknown;
  logicalOperator: QueryLogicalOperator;
}
