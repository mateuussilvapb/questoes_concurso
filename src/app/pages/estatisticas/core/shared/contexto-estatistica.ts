//Aplicação
import { HistoricoQuestao } from '../../../historico/core/models/historico-questao.model';

export interface ContextoEstatistica {
  nomesMateria: ReadonlyMap<string, string>;
  nomesAssunto: ReadonlyMap<string, string>;
}

export interface BaseEstatistica {
  historicos: HistoricoQuestao[];
  contexto: ContextoEstatistica;
}

export const MINIMO_QUESTOES_RELEVANCIA = 5;
export const TAMANHO_RANKING_PONTOS_FRACOS = 5;
export const MAX_BUCKETS_SERIE = 400;
export const LABEL_MATERIA_REMOVIDA = 'Matéria removida';
export const LABEL_ASSUNTO_REMOVIDO = 'Assunto removido';
export const LABEL_SEM_MATERIA = 'Sem matéria';
export const LABEL_SEM_ASSUNTO = 'Sem assunto';
