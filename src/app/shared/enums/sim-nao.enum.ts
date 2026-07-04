import { Util } from '../util/util';

export enum SimNao {
  SIM = 1,
  NAO = 2,
}

export const SIM_NAO_LABEL: Record<SimNao, string> = {
  [SimNao.SIM]: 'Sim',
  [SimNao.NAO]: 'Não',
};

export const SIM_NAO_BOOLEAN: Record<SimNao, boolean> = {
  [SimNao.SIM]: true,
  [SimNao.NAO]: false,
};

export const OPCOES_SIM_NAO = Util.mapearEnumParaOpcoes<SimNao>(SimNao, SIM_NAO_LABEL);
