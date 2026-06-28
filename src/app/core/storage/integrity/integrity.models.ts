export interface DeleteValidationResult {
  canDelete: boolean;
  message?: string;
  dependencies?: {
    assuntos?: number;
    questoes?: number;
    historicos?: number;
  };
}
