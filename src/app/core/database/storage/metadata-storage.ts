import { ColumnMetadata } from '../metadata/column-metadata';
import { EntityMetadata } from '../metadata/entity-metadata';

export class MetadataStorage {
  /**
   * Catálogo das entidades.
   *
   * A chave é o construtor da classe.
   */
  private static readonly entities = new Map<Function, EntityMetadata>();

  /**
   * Obtém a metadata da entidade.
   * Caso ainda não exista, ela é criada.
   */
  static getOrCreateEntity(target: Function): EntityMetadata {
    let metadata = this.entities.get(target);

    if (!metadata) {
      metadata = {
        target,
        table: undefined,
        columns: [],
      };

      this.entities.set(target, metadata);
    }

    return metadata;
  }

  /**
   * Procura uma entidade.
   */
  static getEntity(target: Function): EntityMetadata | undefined {
    return this.entities.get(target);
  }

  /**
   * Retorna todas as entidades registradas.
   */
  static getEntities(): EntityMetadata[] {
    return [...this.entities.values()];
  }

  /**
   * Define o nome da tabela.
   */
  static setTable(target: Function, table: string): void {
    const entity = this.getOrCreateEntity(target);

    entity.table = table;
  }

  /**
   * Procura uma coluna.
   */
  static getColumn(target: Function, property: string): ColumnMetadata | undefined {
    return this.getOrCreateEntity(target).columns.find((c) => c.property === property);
  }

  /**
   * Obtém ou cria uma coluna.
   */
  static getOrCreateColumn(target: Function, property: string): ColumnMetadata {
    const entity = this.getOrCreateEntity(target);

    let column = entity.columns.find((c) => c.property === property);

    if (!column) {
      column = {
        property,
        reflectedType: undefined,
        primaryKey: false,
        autoIncrement: false,
        indexed: false,
        unique: false,
        multiEntry: false,
      };

      entity.columns.push(column);
    }

    return column;
  }

  /**
   * Remove todos os metadados.
   * Muito útil para testes unitários.
   */
  static clear(): void {
    this.entities.clear();
  }
}
