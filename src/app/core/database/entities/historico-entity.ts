import { Index } from '../decorators/index.decorator';
import { Table } from '../decorators/table.decorator';
import { PersistentEntity } from './persistent-entity';
import { NivelDificuldade } from '../../../pages/questoes/core/enums/nivel-dificuldade.enum';

@Table('historico')
export class HistoricoEntity extends PersistentEntity {
  @Index()
  idQuestao!: string;

  @Index()
  respondidaEm!: string;

  idAlternativaSelecionada!: string;

  @Index()
  correta!: boolean;

  tempoResposta!: number;

  @Index()
  dificuldade!: NivelDificuldade;

  @Index()
  idMateria!: string;

  @Index({ multiEntry: true })
  idsAssuntos!: string[];
}
