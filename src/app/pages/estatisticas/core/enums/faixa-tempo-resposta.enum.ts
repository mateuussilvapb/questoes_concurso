//Aplicação
import { Util } from '../../../../shared/util/util';

export enum FaixaTempoResposta {
  ATE_30S = 1,
  DE_30S_A_1MIN = 2,
  DE_1MIN_A_2MIN = 3,
  ACIMA_2MIN = 4,
}

export const FAIXA_TEMPO_RESPOSTA_LABEL: Record<FaixaTempoResposta, string> = {
  [FaixaTempoResposta.ATE_30S]: 'Até 30s',
  [FaixaTempoResposta.DE_30S_A_1MIN]: '30s a 1min',
  [FaixaTempoResposta.DE_1MIN_A_2MIN]: '1min a 2min',
  [FaixaTempoResposta.ACIMA_2MIN]: 'Acima de 2min',
};

export const OPCOES_FAIXA_TEMPO_RESPOSTA = Util.mapearEnumParaOpcoes<FaixaTempoResposta>(
  FaixaTempoResposta,
  FAIXA_TEMPO_RESPOSTA_LABEL,
);

/** Limite superior EXCLUSIVO, em segundos. */
export const LIMITES_FAIXA_TEMPO: ReadonlyArray<{ faixa: FaixaTempoResposta; limite: number }> = [
  { faixa: FaixaTempoResposta.ATE_30S, limite: 30 },
  { faixa: FaixaTempoResposta.DE_30S_A_1MIN, limite: 60 },
  { faixa: FaixaTempoResposta.DE_1MIN_A_2MIN, limite: 120 },
  { faixa: FaixaTempoResposta.ACIMA_2MIN, limite: Number.POSITIVE_INFINITY },
];
