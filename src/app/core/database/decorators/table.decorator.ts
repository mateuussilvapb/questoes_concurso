import { MetadataStorage } from '../metadata/metadata.storage';

export function Table(name: string) {
  return function (constructor: Function) {
    MetadataStorage.addEntity({
      table: name,
      target: constructor,
      indexes: [],
    });
  };
}
