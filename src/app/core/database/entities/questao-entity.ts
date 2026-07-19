import { Index } from '../decorators/index.decorator';
import { Table } from '../decorators/table.decorator';
import { PersistentEntity } from './persistent-entity';

@Table('questao')
export class Questao extends PersistentEntity {
  @Index()
  enunciado!: string;
}
