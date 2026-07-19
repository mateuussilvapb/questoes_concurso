import Dexie from 'dexie';
import { DexieSchemaBuilder } from './builder/dexie-schema.builder';
import './registry/entity.registry';

export class AppDatabase extends Dexie {
  private static readonly DB_NAME = 'QuestoesDB';
  private static readonly DB_VERSION = 1;

  constructor() {
    super(AppDatabase.DB_NAME);

    this.version(AppDatabase.DB_VERSION).stores(DexieSchemaBuilder.build());
  }
}
