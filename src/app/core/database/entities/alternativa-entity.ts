import { Index } from '../decorators/index.decorator';
import { Table } from '../decorators/table.decorator';
import { PersistentEntity } from './persistent-entity';

@Table('alternativa')
export class AlternativaEntity extends PersistentEntity {
  @Index()
  texto!: string;
}
