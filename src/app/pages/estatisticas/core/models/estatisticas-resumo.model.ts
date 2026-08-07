export interface EstatisticasResumo {
  totalRespondidas: number;
  totalCorretas: number;
  totalIncorretas: number;
  aproveitamento: number | null;
  tempoMedioResposta: number | null;
  tempoTotalEstudo: number;
  diasEstudados: number;
  mediaQuestoesPorDia: number | null;
  sequenciaAtualDias: number;
  sequenciaRecordeDias: number;
  primeiraRespostaEm: string | null;
  ultimaRespostaEm: string | null;
}
