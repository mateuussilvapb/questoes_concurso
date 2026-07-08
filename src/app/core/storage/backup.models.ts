import { Assunto } from '../../pages/assuntos/core/models/assunto.model';
import { Historico } from '../../pages/estatisticas/core/models/historico.model';
import { Materia } from '../../pages/materias/core/models/materia.model';
import { Questao } from '../../pages/questoes/core/models/questao.model';

export interface BackupData {
  versao: number;
  exportadoEm: string;

  materias: Materia[];
  assuntos: Assunto[];
  questoes: Questao[];
  historicos: Historico[];
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
  materias: ImportResult;
  assuntos: ImportResult;
  questoes: ImportResult;
  historicos: ImportResult;
}
