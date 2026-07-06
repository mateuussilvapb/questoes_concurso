import { Util } from "../../../../shared/util/util";

export enum TipoQuestao {
  MULTIPLA_ESCOLHA = 1,
  VF = 2
}

export const TIPO_QUESTAO_LABEL: Record<TipoQuestao, string> = {
  [TipoQuestao.MULTIPLA_ESCOLHA]: 'Múltipla Escolha',
  [TipoQuestao.VF]: 'Verdadeiro/Falso',
};

export const OPCOES_TIPO_QUESTAO = Util.mapearEnumParaOpcoes<TipoQuestao>(
  TipoQuestao,
  TIPO_QUESTAO_LABEL
);
