import { Assunto } from '../../pages/assuntos/core/models/assunto.model';
import { Banca } from '../../pages/bancas/core/models/banca.model';
import { Materia } from '../../pages/materias/core/models/materia.model';
import { Questao } from '../../pages/questoes/core/models/questao.model';
import { HistoricoQuestao } from '../../pages/historico/core/models/historico-questao.model';

export interface BackupData {
  versao: number;
  exportadoEm: string;

  /** Contador monotônico de envios à nuvem, independente de `versao`. Ausente em backups locais e em backups anteriores à Fase 1. */
  revisao?: number;
  /** Id do dispositivo que gerou este backup (ver DispositivoService). Ausente em backups anteriores à Fase 1. */
  dispositivoId?: string;
  /** Nome amigável do dispositivo que gerou este backup. Ausente em backups anteriores à Fase 1. */
  dispositivoNome?: string;

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
