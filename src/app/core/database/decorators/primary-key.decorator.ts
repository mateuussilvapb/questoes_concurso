import 'reflect-metadata';
import { MetadataStorage } from '../storage/metadata-storage';

export function PrimaryKey(autoIncrement = false): PropertyDecorator {
  return (target, propertyKey) => {
    const column = MetadataStorage.getOrCreateColumn(target.constructor, propertyKey.toString());

    column.primaryKey = true;

    column.autoIncrement = autoIncrement;

    column.reflectedType = Reflect.getMetadata('design:type', target, propertyKey);
  };
}
