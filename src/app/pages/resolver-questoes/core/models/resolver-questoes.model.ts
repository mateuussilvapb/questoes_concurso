import { Questao } from '../../../questoes/core/models/questao.model';

export interface ResolverQuestoes {
  questao: Questao;
  resolvida: boolean;
  correta: boolean;
  alternativaId: string;
  tempoResposta: number;
  respondidaEm: string;
}
