import { BaseEntity } from "../../shared/models/base-entity";

export interface BackupData {
  versao: number;
  exportadoEm: string;

  materias: BaseEntity[];
  assuntos: BaseEntity[];
  questoes: BaseEntity[];
  historicos: BaseEntity[];
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
