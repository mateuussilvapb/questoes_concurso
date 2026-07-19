import { MetadataStorage } from '../storage/metadata-storage';

export function Table(name: string): ClassDecorator {
  return (target) => {
    MetadataStorage.setTable(target, name);
  };
}
