//Aplicação
import { TipoAgrupamento } from '../enums/tipo-agrupamento.enum';

/** Serve matéria, assunto E dificuldade — por isso existe um só componente de gráfico de grupo. */
export interface DesempenhoPorGrupo {
  idGrupo: string;
  nomeGrupo: string;
  tipo: TipoAgrupamento;
  orfao: boolean;
  totalRespondidas: number;
  totalCorretas: number;
  totalIncorretas: number;
  aproveitamento: number | null;
  tempoMedioResposta: number | null;
  tempoTotal: number;
}
