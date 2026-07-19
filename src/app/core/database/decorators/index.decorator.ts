import { IndexOptions } from '../interfaces/index-options';
import { MetadataStorage } from '../metadata/metadata.storage';

export function Index(options?: IndexOptions) {
  return function (target: any, property: string) {
    const metadata = MetadataStorage.getEntities().find((e) => e.target === target.constructor);

    if (!metadata) return;

    metadata.indexes.push({
      property,
      unique: options?.unique,
      multiEntry: options?.multiEntry,
    });
  };
}
