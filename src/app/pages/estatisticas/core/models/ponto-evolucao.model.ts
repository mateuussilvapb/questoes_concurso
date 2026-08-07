//Aplicação
import { GranularidadeTemporal } from '../enums/granularidade-temporal.enum';

export interface PontoEvolucao {
  chave: string;
  label: string;
  inicio: Date;
  granularidade: GranularidadeTemporal;
  totalRespondidas: number;
  totalCorretas: number;
  aproveitamento: number | null;
  aproveitamentoAcumulado: number | null;
}
