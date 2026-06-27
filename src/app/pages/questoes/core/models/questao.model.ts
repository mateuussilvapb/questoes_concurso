import { BaseEntity } from '../../../../shared/models/base-entity';
import { Alternativa } from '../../alternativas/core/models/alternativa.model';
import { NivelDificuldade } from '../enums/nivel-dificuldade.enum';
import { TipoQuestao } from '../enums/tipo-questao.enum';

export interface Questao extends BaseEntity {
  declaracao: string;
  idMateria: string;
  idsAssuntos: string[];
  nivelDificuldade: NivelDificuldade;
  tipo: TipoQuestao;
  alternativas: Alternativa[];
  favoritar: boolean;
  revisada: boolean;
}
