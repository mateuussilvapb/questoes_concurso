import 'reflect-metadata';

import { IndexOptions } from '../interfaces/index-options';
import { MetadataStorage } from '../storage/metadata-storage';

export function Index(options: IndexOptions = {}): PropertyDecorator {
  return (target, propertyKey) => {
    const column = MetadataStorage.getOrCreateColumn(target.constructor, propertyKey.toString());

    column.indexed = true;

    column.unique = options.unique ?? false;

    column.multiEntry = options.multiEntry ?? false;

    column.reflectedType = Reflect.getMetadata('design:type', target, propertyKey);
  };
}
