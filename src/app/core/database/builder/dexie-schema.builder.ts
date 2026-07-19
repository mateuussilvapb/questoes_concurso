import { ColumnMetadata } from '../metadata/column-metadata';
import { MetadataResolver } from '../resolver/metadara-resolver';
import { MetadataStorage } from '../storage/metadata-storage';

export class DexieSchemaBuilder {
  /**
   * Gera o objeto esperado pelo Dexie.
   *
   * Exemplo:
   *
   * {
   *   materia: "id, &nome",
   *   assunto: "id, idMateria"
   * }
   */
  static build(): Record<string, string> {
    const schema: Record<string, string> = {};

    for (const entity of MetadataStorage.getEntities()) {
      // Apenas entidades concretas possuem tabela
      if (!entity.table) {
        continue;
      }

      const resolved = MetadataResolver.resolve(entity.target);

      schema[resolved.table!] = this.buildTable(resolved.columns);
    }

    return schema;
  }

  /**
   * Constrói a DSL de uma tabela.
   */
  private static buildTable(columns: ColumnMetadata[]): string {
    return columns
      .map((column) => this.buildColumn(column))
      .filter(Boolean)
      .join(', ');
  }

  /**
   * Constrói a DSL de uma coluna.
   */
  private static buildColumn(column: ColumnMetadata): string {
    let value = '';

    // Primary Key
    if (column.primaryKey) {
      if (column.autoIncrement) {
        value += '++';
      }

      value += column.property;

      return value;
    }

    // Índices

    if (!column.indexed) {
      return '';
    }

    if (column.unique) {
      value += '&';
    }

    if (column.multiEntry) {
      value += '*';
    }

    value += column.property;

    return value;
  }
}
