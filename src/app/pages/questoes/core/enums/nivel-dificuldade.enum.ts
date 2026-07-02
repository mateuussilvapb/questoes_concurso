import { Util } from "../../../../shared/util/util";

export enum NivelDificuldade {
  MUITO_FACIL = 1,
  FACIL = 2,
  MEDIO = 3,
  DIFICIL = 4,
  MUITO_DIFICIL = 5,
}

export const NIVEL_DIFICULDADE_LABEL: Record<NivelDificuldade, string> = {
  [NivelDificuldade.MUITO_FACIL]: 'Muito Fácil',
  [NivelDificuldade.FACIL]: 'Fácil',
  [NivelDificuldade.MEDIO]: 'Médio',
  [NivelDificuldade.DIFICIL]: 'Difícil',
  [NivelDificuldade.MUITO_DIFICIL]: 'Muito Difícil',
};

// Gerando para Dificuldade
export const OPCOES_NIVEL_DIFICULDADE = Util.mapearEnumParaOpcoes<NivelDificuldade>(
  NivelDificuldade,
  NIVEL_DIFICULDADE_LABEL
);
