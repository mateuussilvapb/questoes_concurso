//Angular
import { TestBed } from '@angular/core/testing';

//Aplicação
import { EstatisticaService } from './estatistica.service';
import { HistoricoService } from '../../../historico/core/services/historico.service';
import { MateriaService } from '../../../materias/core/services/materia.service';
import { AssuntoService } from '../../../assuntos/core/services/assunto.service';
import { HistoricoQuestao } from '../../../historico/core/models/historico-questao.model';
import { NivelDificuldade } from '../../../questoes/core/enums/nivel-dificuldade.enum';
import { GranularidadeTemporal } from '../enums/granularidade-temporal.enum';
import { ContextoEstatistica } from '../shared/contexto-estatistica';

describe('EstatisticaService', () => {
  let service: EstatisticaService;

  const contexto: ContextoEstatistica = {
    nomesMateria: new Map([['m1', 'Direito Constitucional']]),
    nomesAssunto: new Map([
      ['a1', 'Controle de Constitucionalidade'],
      ['a2', 'Direitos Fundamentais'],
    ]),
  };

  function criarHistorico(overrides: Partial<HistoricoQuestao> = {}): HistoricoQuestao {
    return {
      id: String(Math.random()),
      idQuestao: 'q1',
      respondidaEm: new Date().toISOString(),
      idAlternativaSelecionada: 'alt1',
      correta: true,
      tempoResposta: 20,
      dificuldade: NivelDificuldade.MEDIO,
      idMateria: 'm1',
      idsAssuntos: ['a1'],
      dataCriacao: new Date().toISOString(),
      ...overrides,
    };
  }

  function diaOffset(offset: number): string {
    const data = new Date();
    data.setHours(12, 0, 0, 0);
    data.setDate(data.getDate() - offset);
    return data.toISOString();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EstatisticaService,
        { provide: HistoricoService, useValue: {} },
        { provide: MateriaService, useValue: {} },
        { provide: AssuntoService, useValue: {} },
      ],
    });

    service = TestBed.inject(EstatisticaService);
  });

  it('total zero -> aproveitamento null, sem NaN em lugar nenhum', () => {
    const painel = service.montarPainel([], contexto, GranularidadeTemporal.DIA);

    expect(painel.vazio).toBe(true);
    expect(painel.resumo.aproveitamento).toBeNull();
    expect(painel.resumo.tempoMedioResposta).toBeNull();
    expect(painel.resumo.mediaQuestoesPorDia).toBeNull();
    expect(Number.isNaN(painel.resumo.totalRespondidas)).toBe(false);
  });

  it('streak com buraco no meio', () => {
    const historicos = [
      criarHistorico({ respondidaEm: diaOffset(0) }),
      criarHistorico({ respondidaEm: diaOffset(1) }),
      criarHistorico({ respondidaEm: diaOffset(3) }), // buraco no dia -2
    ];

    const painel = service.montarPainel(historicos, contexto, GranularidadeTemporal.DIA);

    expect(painel.resumo.sequenciaAtualDias).toBe(2);
    expect(painel.resumo.sequenciaRecordeDias).toBe(2);
  });

  it('streak terminando ontem conta, terminando anteontem zera', () => {
    const painelOntem = service.montarPainel(
      [criarHistorico({ respondidaEm: diaOffset(1) })],
      contexto,
      GranularidadeTemporal.DIA,
    );
    expect(painelOntem.resumo.sequenciaAtualDias).toBe(1);

    const painelAnteontem = service.montarPainel(
      [criarHistorico({ respondidaEm: diaOffset(2) })],
      contexto,
      GranularidadeTemporal.DIA,
    );
    expect(painelAnteontem.resumo.sequenciaAtualDias).toBe(0);
  });

  it('órfão de matéria e de assunto -> nome correto, orfao true, ausente do ranking', () => {
    const historicos = Array.from({ length: 6 }).map(() =>
      criarHistorico({
        idMateria: 'materia-excluida',
        idsAssuntos: ['assunto-excluido'],
        correta: false,
      }),
    );

    const painel = service.montarPainel(historicos, contexto, GranularidadeTemporal.DIA);

    const materiaOrfa = painel.porMateria.find((m) => m.idGrupo === 'materia-excluida')!;
    expect(materiaOrfa.orfao).toBe(true);
    expect(materiaOrfa.nomeGrupo).toBe('Matéria removida');

    const assuntoOrfao = painel.porAssunto.find((a) => a.idGrupo === 'assunto-excluido')!;
    expect(assuntoOrfao.orfao).toBe(true);
    expect(assuntoOrfao.nomeGrupo).toBe('Assunto removido');

    expect(
      painel.pontosFracosMateria.find((m) => m.idGrupo === 'materia-excluida'),
    ).toBeUndefined();
    expect(
      painel.pontosFracosAssunto.find((a) => a.idGrupo === 'assunto-excluido'),
    ).toBeUndefined();
  });

  it('questão com múltiplos assuntos -> soma dos assuntos maior que o total geral', () => {
    const historicos = [
      criarHistorico({ idsAssuntos: ['a1', 'a2'] }),
      criarHistorico({ idsAssuntos: ['a1'] }),
    ];

    const painel = service.montarPainel(historicos, contexto, GranularidadeTemporal.DIA);
    const somaAssuntos = painel.porAssunto.reduce((acc, a) => acc + a.totalRespondidas, 0);

    expect(somaAssuntos).toBeGreaterThan(painel.resumo.totalRespondidas);
  });

  it('respondidaEm inválido é ignorado sem quebrar', () => {
    const historicos = [criarHistorico(), criarHistorico({ respondidaEm: 'data-invalida' })];

    const painel = service.montarPainel(historicos, contexto, GranularidadeTemporal.DIA);

    expect(painel.resumo.totalRespondidas).toBe(1);
  });

  it('data-fim inclusiva -> resposta às 23h do último dia do filtro entra', () => {
    const hoje23h = new Date();
    hoje23h.setHours(23, 0, 0, 0);

    const dataFimSemHora = new Date();
    dataFimSemHora.setHours(0, 0, 0, 0);

    const historicos = [criarHistorico({ respondidaEm: hoje23h.toISOString() })];

    const filtrados = service.filtrar(historicos, {
      dataFimPeriodoConsulta: dataFimSemHora.toISOString(),
    });

    expect(filtrados.length).toBe(1);
  });

  it('bucket sem estudo -> aproveitamento null, não 0', () => {
    const historicos = [
      criarHistorico({ respondidaEm: diaOffset(3) }),
      criarHistorico({ respondidaEm: diaOffset(0) }),
    ];

    const painel = service.montarPainel(historicos, contexto, GranularidadeTemporal.DIA);
    const bucketVazio = painel.evolucao.find((p) => p.totalRespondidas === 0);

    expect(bucketVazio).toBeDefined();
    expect(bucketVazio!.aproveitamento).toBeNull();
    expect(bucketVazio!.totalRespondidas).toBe(0);
  });
});
