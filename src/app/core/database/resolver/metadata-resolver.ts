import { ColumnMetadata } from '../metadata/column-metadata';
import { EntityMetadata } from '../metadata/entity-metadata';
import { MetadataStorage } from '../storage/metadata-storage';

export class MetadataResolver {
  /**
   * Resolve completamente uma entidade.
   */
  static resolve(target: Function): EntityMetadata {
    const entity = MetadataStorage.getEntity(target);

    if (!entity) {
      throw new Error(`A entidade '${target.name}' não foi registrada.`);
    }

    return {
      ...entity,
      columns: this.resolveColumns(target),
    };
  }

  /**
   * Resolve todas as colunas da entidade,
   * incluindo as herdadas.
   */
  static resolveColumns(target: Function): ColumnMetadata[] {
    const hierarchy = this.getHierarchy(target);

    /**
     * property -> metadata
     */
    const columns = new Map<string, ColumnMetadata>();

    for (const entity of hierarchy) {
      for (const column of entity.columns) {
        columns.set(column.property, structuredClone(column));
      }
    }

    return [...columns.values()];
  }

  /**
   * Retorna toda a hierarquia da entidade.
   *
   * Exemplo:
   *
   * PersistentEntity
   *        ↓
   * AuditEntity
   *        ↓
   * Materia
   *
   * Resultado:
   *
   * [
   *   PersistentEntity,
   *   AuditEntity,
   *   Materia
   * ]
   */
  private static getHierarchy(target: Function): EntityMetadata[] {
    const hierarchy: EntityMetadata[] = [];

    let current: Function | null = target;

    while (current && current !== Function.prototype && current !== Object) {
      const entity = MetadataStorage.getEntity(current);

      if (entity) {
        hierarchy.push(entity);
      }

      current = Object.getPrototypeOf(current);
    }

    /**
     * Inverte para:
     *
     * Base → Derivada
     */
    return hierarchy.reverse();
  }
}
