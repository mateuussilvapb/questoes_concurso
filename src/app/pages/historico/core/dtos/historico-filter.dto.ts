import { NivelDificuldade } from '../../../questoes/core/enums/nivel-dificuldade.enum';

export interface HistoricoFilter {
  idQuestao: string;
  dataFimPeriodoConsulta: string;
  dataInicioPeriodoConsulta: string;
  correta: boolean;
  dificuldade: NivelDificuldade;
  idMateria: string;
  idsAssuntos: string[];
}
