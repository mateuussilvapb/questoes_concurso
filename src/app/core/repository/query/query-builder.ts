import { Table } from 'dexie';

import { EntityMetadata } from '../../database/metadata/entity-metadata';
import { QueryExecutor } from './query-executor';
import { QueryLogicalOperator } from './query-logical-operator';
import { QueryOperator } from './query-operator';
import { QueryState } from './query-state';

export class QueryBuilder<T extends object> {
  private readonly state: QueryState<T> = {
    conditions: [],
  };

  private currentProperty?: keyof T;

  private nextLogicalOperator = QueryLogicalOperator.AND;

  constructor(
    private readonly table: Table<T, string>,
    private readonly metadata: EntityMetadata,
  ) {}

  where(property: keyof T): this {
    this.currentProperty = property;

    return this;
  }

  and(property: keyof T): this {
    this.nextLogicalOperator = QueryLogicalOperator.AND;

    this.currentProperty = property;

    return this;
  }

  or(property: keyof T): this {
    this.nextLogicalOperator = QueryLogicalOperator.OR;

    this.currentProperty = property;

    return this;
  }

  equals(value: unknown): this {
    return this.addCondition(QueryOperator.EQUALS, value);
  }

  notEquals(value: unknown): this {
    return this.addCondition(QueryOperator.NOT_EQUALS, value);
  }

  greaterThan(value: unknown): this {
    return this.addCondition(QueryOperator.GREATER_THAN, value);
  }

  greaterThanOrEqual(value: unknown): this {
    return this.addCondition(QueryOperator.GREATER_THAN_OR_EQUAL, value);
  }

  lessThan(value: unknown): this {
    return this.addCondition(QueryOperator.LESS_THAN, value);
  }

  lessThanOrEqual(value: unknown): this {
    return this.addCondition(QueryOperator.LESS_THAN_OR_EQUAL, value);
  }

  contains(value: string): this {
    return this.addCondition(QueryOperator.CONTAINS, value);
  }

  startsWith(value: string): this {
    return this.addCondition(QueryOperator.STARTS_WITH, value);
  }

  endsWith(value: string): this {
    return this.addCondition(QueryOperator.ENDS_WITH, value);
  }

  between(start: unknown, end: unknown): this {
    this.validateCurrentProperty();

    this.state.conditions.push({
      property: this.currentProperty!,
      operator: QueryOperator.BETWEEN,
      value: start,
      secondValue: end,
      logicalOperator: this.nextLogicalOperator,
    });

    this.clearCurrentProperty();

    return this;
  }

  orderBy(property: keyof T): this {
    this.state.order = {
      property,
      ascending: true,
    };

    return this;
  }

  asc(): this {
    this.ensureOrder();

    this.state.order!.ascending = true;

    return this;
  }

  desc(): this {
    this.ensureOrder();

    this.state.order!.ascending = false;

    return this;
  }

  page(page: number): this {
    this.state.page = page;

    return this;
  }

  limit(limit: number): this {
    this.state.limit = limit;

    return this;
  }

  build(): QueryState<T> {
    return structuredClone(this.state);
  }

  /*
   * Métodos de execução
   */

  async list(): Promise<T[]> {
    return this.executor().execute(this.build());
  }

  async first(): Promise<T | undefined> {
    return this.executor().first(this.build());
  }

  async last(): Promise<T | undefined> {
    return this.executor().last(this.build());
  }

  async count(): Promise<number> {
    return this.executor().count(this.build());
  }

  async exists(): Promise<boolean> {
    return this.executor().exists(this.build());
  }

  /*
   * Privados
   */

  private executor(): QueryExecutor<T> {
    return new QueryExecutor(this.table, this.metadata);
  }

  private addCondition(operator: QueryOperator, value: unknown): this {
    this.validateCurrentProperty();

    this.state.conditions.push({
      property: this.currentProperty!,
      operator,
      value,
      logicalOperator: this.nextLogicalOperator,
    });

    this.clearCurrentProperty();

    return this;
  }

  private validateCurrentProperty(): void {
    if (!this.currentProperty) {
      throw new Error('where(), and() ou or() devem ser chamados antes do operador.');
    }
  }

  private clearCurrentProperty(): void {
    this.currentProperty = undefined;

    this.nextLogicalOperator = QueryLogicalOperator.AND;
  }

  private ensureOrder(): void {
    if (!this.state.order) {
      throw new Error('orderBy() deve ser chamado antes.');
    }
  }
}
