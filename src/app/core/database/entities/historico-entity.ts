import { Index } from '../decorators/index.decorator';
import { Table } from '../decorators/table.decorator';
import { PersistentEntity } from './persistent-entity';

@Table('historico')
export class HistoricoEntity extends PersistentEntity {
  @Index()
  idQuestao!: string;

  @Index()
  acertou!: boolean;

  @Index()
  dataResolucao!: Date;
}
