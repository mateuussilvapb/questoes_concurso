import { Util } from '../../../../shared/util/util';

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

export const STYLE_CLASS_TAG_DIFICULDADE_LIGHT: Record<NivelDificuldade, string> = {
  [NivelDificuldade.MUITO_FACIL]: 'bg-green-100 text-green-900',
  [NivelDificuldade.FACIL]: 'bg-blue-100 text-blue-900',
  [NivelDificuldade.MEDIO]: 'bg-yellow-100 text-yellow-900',
  [NivelDificuldade.DIFICIL]: 'bg-orange-100 text-orange-900',
  [NivelDificuldade.MUITO_DIFICIL]: 'bg-red-100 text-red-900',
};

export const STYLE_CLASS_TAG_DIFICULDADE_DARK: Record<NivelDificuldade, string> = {
  [NivelDificuldade.MUITO_FACIL]: 'bg-green-900 text-green-100',
  [NivelDificuldade.FACIL]: 'bg-blue-900 text-blue-100',
  [NivelDificuldade.MEDIO]: 'bg-yellow-900 text-yellow-100',
  [NivelDificuldade.DIFICIL]: 'bg-orange-900 text-orange-100',
  [NivelDificuldade.MUITO_DIFICIL]: 'bg-red-900 text-red-100',
};

// Gerando para Dificuldade
export const OPCOES_NIVEL_DIFICULDADE = Util.mapearEnumParaOpcoes<NivelDificuldade>(
  NivelDificuldade,
  NIVEL_DIFICULDADE_LABEL,
);
