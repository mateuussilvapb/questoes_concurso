//Aplicação
import { FaixaTempoResposta } from '../enums/faixa-tempo-resposta.enum';

export interface DesempenhoPorFaixaTempo {
  faixa: FaixaTempoResposta;
  label: string;
  totalRespondidas: number;
  totalCorretas: number;
  aproveitamento: number | null;
  participacao: number | null;
}
