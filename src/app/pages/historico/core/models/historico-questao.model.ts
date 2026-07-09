import { BaseEntity } from '../../../../shared/models/base-entity';
import { NivelDificuldade } from '../../../questoes/core/enums/nivel-dificuldade.enum';

export interface HistoricoQuestao extends BaseEntity {
  idQuestao: string;
  //sessionId: string; (TODO: possibilidade futura)
  respondidaEm: string;
  idAlternativaSelecionada: string;
  correta: boolean;
  tempoResposta: number; //Segundos
  dificuldade: NivelDificuldade;
  idMateria: string;
  idsAssuntos: string[];
}
