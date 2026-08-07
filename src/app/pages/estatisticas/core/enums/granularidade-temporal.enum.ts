//Aplicação
import { Util } from '../../../../shared/util/util';

export enum GranularidadeTemporal {
  DIA = 1,
  SEMANA = 2,
  MES = 3,
}

export const GRANULARIDADE_TEMPORAL_LABEL: Record<GranularidadeTemporal, string> = {
  [GranularidadeTemporal.DIA]: 'Por dia',
  [GranularidadeTemporal.SEMANA]: 'Por semana',
  [GranularidadeTemporal.MES]: 'Por mês',
};

export const OPCOES_GRANULARIDADE_TEMPORAL = Util.mapearEnumParaOpcoes<GranularidadeTemporal>(
  GranularidadeTemporal,
  GRANULARIDADE_TEMPORAL_LABEL,
);
