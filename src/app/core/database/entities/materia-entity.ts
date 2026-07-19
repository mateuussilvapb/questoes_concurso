import { Index } from '../decorators/index.decorator';
import { Table } from '../decorators/table.decorator';
import { PersistentEntity } from './persistent-entity';

@Table('materia')
export class MateriaEntity extends PersistentEntity {
  @Index({ unique: true })
  nome!: string;

  @Index()
  descricao!: string;
}
