import { BaseEntity } from '../../../../shared/models/base-entity';
import { Alternativa } from '../../alternativas/core/models/alternativa.model';
import { NivelDificuldade } from '../enums/nivel-dificuldade.enum';
import { TipoQuestao } from '../enums/tipo-questao.enum';
import { ObservacoesQuestoes } from '../observacoes-questoes/models/observacoes-questoes-model';
import { QuestaoStatus } from './questao-status.model';

export interface Questao extends BaseEntity {
  declaracao: string;
  observacao: ObservacoesQuestoes;
  idMateria: string;
  idsAssuntos: string[];
  nivelDificuldade: NivelDificuldade;
  tipo: TipoQuestao;
  alternativas: Alternativa[];
  status: QuestaoStatus;
}
