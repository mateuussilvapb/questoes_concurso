//Aplicação
import { NivelDificuldade } from '../../../questoes/core/enums/nivel-dificuldade.enum';
import { GranularidadeTemporal } from '../enums/granularidade-temporal.enum';

/**
 * Deliberadamente sem `correta`: filtrar por "só acertos" destruiria o cálculo
 * de aproveitamento (daria sempre 100%). Se um dia isso for desejado, é um
 * toggle de visualização, não um filtro de base.
 */
export interface EstatisticaFilter {
  dataInicioPeriodoConsulta?: string | null;
  dataFimPeriodoConsulta?: string | null;
  idMateria?: string | null;
  idsAssuntos?: string[] | null;
  dificuldade?: NivelDificuldade | null;
  granularidade?: GranularidadeTemporal;
}
