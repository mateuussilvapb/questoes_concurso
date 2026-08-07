import { Index } from '../decorators/index.decorator';
import { Table } from '../decorators/table.decorator';
import { PersistentEntity } from './persistent-entity';

@Table('banca')
export class BancaEntity extends PersistentEntity {
  @Index({ unique: true })
  nome!: string;

  @Index()
  descricao!: string;
}
