import { Index } from '../decorators/index.decorator';
import { Table } from '../decorators/table.decorator';
import { PersistentEntity } from './persistent-entity';

@Table('assunto')
export class Assunto extends PersistentEntity {
  @Index({ unique: true })
  nome!: string;

  @Index()
  descricao!: string;
}
