import { EntityMetadata } from '../interfaces/entity-metadata';

export class MetadataStorage {
  private static readonly entities: EntityMetadata[] = [];

  static addEntity(entity: EntityMetadata) {
    this.entities.push(entity);
  }

  static getEntities() {
    return this.entities;
  }
}
