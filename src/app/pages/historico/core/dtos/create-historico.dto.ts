import { NivelDificuldade } from '../../../questoes/core/enums/nivel-dificuldade.enum';

export interface CreateHistoricoQuestao {
  idQuestao: string;
  respondidaEm: string;
  idAlternativaSelecionada: string;
  correta: boolean;
  tempoResposta: number; //Segundos
  dificuldade: NivelDificuldade;
  idMateria: string;
  idsAssuntos: string[];
}
