import { SimNao } from '../../../../shared/enums/sim-nao.enum';
import { NivelDificuldade } from '../enums/nivel-dificuldade.enum';
import { TipoQuestao } from '../enums/tipo-questao.enum';

export interface QuestaoFilter {
  enunciado?: string;
  observacao?: string;
  idMateria?: string;
  idsAssuntos?: string[];
  tipo?: TipoQuestao;
  nivelDificuldade?: NivelDificuldade;
  favorita?: SimNao;
  revisada?: SimNao;
  marcadaParaRevisao?: SimNao;
}
