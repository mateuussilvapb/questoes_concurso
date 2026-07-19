import { MetadataStorage } from '../metadata/metadata.storage';

export function PrimaryKey(autoIncrement = false) {
  return function (target: any, property: string) {
    const metadata = MetadataStorage.getEntities().find((e) => e.target === target.constructor);
    if (!metadata) return;
    metadata.primaryKey = property;
    metadata.autoIncrement = autoIncrement;
  };
}
