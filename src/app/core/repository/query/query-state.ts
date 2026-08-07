import { QueryCondition } from './query-condition';
import { QueryOrder } from './query-order';

export interface QueryState<T> {
  conditions: QueryCondition<T>[];
  order?: QueryOrder<T>;
  page?: number;
  limit?: number;
}
