import { Table } from '../decorators/table.decorator';
import { PersistentEntity } from './persistent-entity';

@Table('historico')
export class HistoricoEntity extends PersistentEntity {}
