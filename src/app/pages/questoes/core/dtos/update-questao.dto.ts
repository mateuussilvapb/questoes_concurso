import { AlternativaDto } from '../../alternativas/core/dtos/alternativa.dto';
import { NivelDificuldade } from '../enums/nivel-dificuldade.enum';
import { TipoQuestao } from '../enums/tipo-questao.enum';

export interface UpdateQuestaoDto {
  id: string;
  declaracao: string;
  idMateria: string;
  idsAssuntos: string[];
  nivelDificuldade: NivelDificuldade;
  tipo: TipoQuestao;
  alternativas: AlternativaDto[];
  favoritar: boolean;
  revisada: boolean;
}
