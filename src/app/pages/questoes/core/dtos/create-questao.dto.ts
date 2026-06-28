import { AlternativaDto } from '../../alternativas/core/dtos/alternativa.dto';
import { NivelDificuldade } from '../enums/nivel-dificuldade.enum';
import { TipoQuestao } from '../enums/tipo-questao.enum';
import { QuestaoStatus } from '../models/questao-status.model';
import { ObservacoesQuestoes } from '../observacoes-questoes/models/observacoes-questoes-model';

export interface CreateQuestaoDto {
  declaracao: string;
  observacao: ObservacoesQuestoes;
  idMateria: string;
  idsAssuntos: string[];
  nivelDificuldade: NivelDificuldade;
  tipo: TipoQuestao;
  alternativas: AlternativaDto[];
  status: QuestaoStatus;
}
