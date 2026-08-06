import { IndexableType, Table } from 'dexie';

import { EntityMetadata } from '../../database/metadata/entity-metadata';

import { QueryCondition } from './query-condition';
import { QueryLogicalOperator } from './query-logical-operator';
import { QueryOperator } from './query-operator';
import { QueryOrder } from './query-order';
import { QueryState } from './query-state';

export class QueryExecutor<T extends object> {
  constructor(
    private readonly table: Table<T, string>,
    private readonly metadata: EntityMetadata,
  ) {}

  async execute(state: QueryState<T>): Promise<T[]> {
    let result = await this.executeConditions(state.conditions);

    if (state.order) {
      result = this.applyOrder(result, state.order);
    }

    result = this.applyPagination(result, state.page, state.limit);

    return result;
  }

  private applyPagination(data: T[], page?: number, limit?: number): T[] {
    if (page === undefined || limit === undefined) {
      return data;
    }

    const start = page * limit;

    return data.slice(start, start + limit);
  }

  async first(state: QueryState<T>): Promise<T | undefined> {
    const result = await this.execute(state);

    return result[0];
  }

  async last(state: QueryState<T>): Promise<T | undefined> {
    const result = await this.execute(state);

    return result[result.length - 1];
  }

  async count(state: QueryState<T>): Promise<number> {
    const result = await this.execute(state);

    return result.length;
  }

  async exists(state: QueryState<T>): Promise<boolean> {
    const result = await this.execute(state);

    return result.length > 0;
  }

  private async executeConditions(conditions: QueryCondition<T>[]): Promise<T[]> {
    if (conditions.length === 0) {
      return this.table.toArray();
    }

    const firstCondition = conditions[0];

    const column = this.metadata.columns.find(
      (column) => column.property === firstCondition.property,
    );

    let result: T[];

    /**
     * Caso a primeira condição utilize um índice,
     * aproveitamos o mecanismo nativo do IndexedDB.
     */
    const indexedResult = await this.executeUsingIndex(firstCondition);

    if (indexedResult !== undefined) {
      result = indexedResult;
    } else {
      result = await this.table.toArray();
    }

    /**
     * As demais condições são aplicadas em memória.
     *
     * Isso permite combinar:
     *
     * nome = "Direito"
     * AND
     * ativo = true
     *
     * ou
     *
     * nome = "Direito"
     * OR
     * nome = "Português"
     */
    if (conditions.length > 1) {
      result = result.filter((entity) => this.matchesConditions(entity, conditions));
    } else if (!(column?.indexed && firstCondition.operator === QueryOperator.EQUALS)) {
      result = result.filter((entity) => this.matchesCondition(entity, firstCondition));
    }

    return result;
  }
  private matchesConditions(entity: T, conditions: QueryCondition<T>[]): boolean {
    let result = this.matchesCondition(entity, conditions[0]);

    for (let index = 1; index < conditions.length; index++) {
      const condition = conditions[index];

      const currentResult = this.matchesCondition(entity, condition);

      switch (condition.logicalOperator) {
        case QueryLogicalOperator.AND:
          result = result && currentResult;

          break;

        case QueryLogicalOperator.OR:
          result = result || currentResult;

          break;
      }
    }

    return result;
  }

  private matchesCondition(entity: T, condition: QueryCondition<T>): boolean {
    const value = entity[condition.property];

    switch (condition.operator) {
      case QueryOperator.EQUALS:
        return value === condition.value;

      case QueryOperator.NOT_EQUALS:
        return value !== condition.value;

      case QueryOperator.GREATER_THAN:
        return value !== undefined && value !== null && value > condition.value;

      case QueryOperator.GREATER_THAN_OR_EQUAL:
        return value !== undefined && value !== null && value >= condition.value;

      case QueryOperator.LESS_THAN:
        return value !== undefined && value !== null && value < condition.value;

      case QueryOperator.LESS_THAN_OR_EQUAL:
        return value !== undefined && value !== null && value <= condition.value;

      case QueryOperator.BETWEEN:
        return this.isBetween(value, condition.value, condition.secondValue);

      case QueryOperator.CONTAINS:
        return this.isContains(value, condition.value);

      case QueryOperator.STARTS_WITH:
        return this.isStartsWith(value, condition.value);

      case QueryOperator.ENDS_WITH:
        return this.isEndsWith(value, condition.value);

      default:
        return false;
    }
  }

  private isBetween(value: unknown, start: unknown, end: unknown): boolean {
    if (value === undefined || value === null) {
      return false;
    }

    return value >= start && value <= end;
  }

  private isContains(value: unknown, search: unknown): boolean {
    if (typeof value !== 'string' || typeof search !== 'string') {
      return false;
    }

    return value.toLowerCase().includes(search.toLowerCase());
  }

  private isStartsWith(value: unknown, search: unknown): boolean {
    if (typeof value !== 'string' || typeof search !== 'string') {
      return false;
    }

    return value.toLowerCase().startsWith(search.toLowerCase());
  }

  private isEndsWith(value: unknown, search: unknown): boolean {
    if (typeof value !== 'string' || typeof search !== 'string') {
      return false;
    }

    return value.toLowerCase().endsWith(search.toLowerCase());
  }

  private async executeUsingIndex(condition: QueryCondition<T>): Promise<T[] | undefined> {
    const column = this.metadata.columns.find((column) => column.property === condition.property);

    /**
     * A coluna precisa estar configurada
     * como índice no IndexedDB.
     */
    if (!column?.indexed) {
      return undefined;
    }

    /**
     * Na primeira versão,
     * somente equals utiliza índice diretamente.
     *
     * Outros operadores serão tratados
     * posteriormente.
     */
    if (condition.operator !== QueryOperator.EQUALS) {
      return undefined;
    }

    const result = await this.table
      .where(condition.property as string)
      .equals(condition.value as IndexableType)
      .toArray();

    return result;
  }

  private applyOrder(data: T[], order: QueryOrder<T>): T[] {
    const sorted = [...data];

    sorted.sort((a, b) => {
      const first = a[order.property];

      const second = b[order.property];

      if (first === second) {
        return 0;
      }

      if (first === undefined || first === null) {
        return 1;
      }

      if (second === undefined || second === null) {
        return -1;
      }

      let comparison = 0;

      if (first > second) {
        comparison = 1;
      } else if (first < second) {
        comparison = -1;
      }

      return order.ascending ? comparison : -comparison;
    });

    return sorted;
  }
}
