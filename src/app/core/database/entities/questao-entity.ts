import { Index } from '../decorators/index.decorator';
import { Table } from '../decorators/table.decorator';
import { PersistentEntity } from './persistent-entity';
import { Alternativa } from '../../../pages/questoes/alternativas/core/models/alternativa.model';
import { NivelDificuldade } from '../../../pages/questoes/core/enums/nivel-dificuldade.enum';
import { TipoQuestao } from '../../../pages/questoes/core/enums/tipo-questao.enum';
import { QuestaoStatus } from '../../../pages/questoes/core/models/questao-status.model';
import { ObservacoesQuestoes } from '../../../pages/questoes/core/observacoes-questoes/models/observacoes-questoes-model';

@Table('questao')
export class QuestaoEntity extends PersistentEntity {
  @Index()
  enunciado!: string;

  @Index()
  idMateria!: string;

  @Index({ multiEntry: true })
  idsAssuntos!: string[];

  @Index()
  idBanca?: string;

  @Index()
  nivelDificuldade!: NivelDificuldade;

  @Index()
  tipo!: TipoQuestao;

  alternativas!: Alternativa[];

  status!: QuestaoStatus;

  observacao!: ObservacoesQuestoes;
}
