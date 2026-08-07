import { Assunto } from '../../pages/assuntos/core/models/assunto.model';
import { Banca } from '../../pages/bancas/core/models/banca.model';
import { Materia } from '../../pages/materias/core/models/materia.model';
import { Questao } from '../../pages/questoes/core/models/questao.model';
import { HistoricoQuestao } from '../../pages/historico/core/models/historico-questao.model';

export interface BackupData {
  versao: number;
  exportadoEm: string;

  materias: Materia[];
  assuntos: Assunto[];
  bancas: Banca[];
  questoes: Questao[];
  historicos: HistoricoQuestao[];
}

export enum ImportMode {
  REPLACE = 'replace',
  MERGE = 'merge',
}

export interface ImportResult {
  imported: number;
  ignored: number;
}

export interface MergeResult {
  versaoOrigem: number;
  materias: ImportResult;
  assuntos: ImportResult;
  bancas: ImportResult;
  questoes: ImportResult;
  historicos: ImportResult;
}
