//Aplicação
import { EstatisticasResumo } from './estatisticas-resumo.model';
import { PontoEvolucao } from './ponto-evolucao.model';
import { DesempenhoPorGrupo } from './desempenho-grupo.model';
import { DesempenhoPorFaixaTempo } from './desempenho-tempo.model';

export interface PainelEstatisticas {
  resumo: EstatisticasResumo;
  evolucao: PontoEvolucao[];
  porMateria: DesempenhoPorGrupo[];
  porAssunto: DesempenhoPorGrupo[];
  porDificuldade: DesempenhoPorGrupo[];
  pontosFracosMateria: DesempenhoPorGrupo[];
  pontosFracosAssunto: DesempenhoPorGrupo[];
  faixasTempo: DesempenhoPorFaixaTempo[];
  vazio: boolean;
}
