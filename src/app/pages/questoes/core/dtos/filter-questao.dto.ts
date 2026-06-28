import { Alternativa } from '../../alternativas/core/models/alternativa.model';
import { NivelDificuldade } from '../enums/nivel-dificuldade.enum';
import { TipoQuestao } from '../enums/tipo-questao.enum';

export interface QuestaoFilter {
  declaracao?: string;
  observacao?: string;
  idMateria?: string;
  idsAssuntos?: string[];
  tipo?: TipoQuestao;
  nivelDificuldade?: NivelDificuldade;
  favorita?: boolean;
  revisada?: boolean;
}
