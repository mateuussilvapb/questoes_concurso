//Angular
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

//Aplicação
import { ListBase } from '../../../../shared/components/list-base/list-base';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';
import { Assunto } from '../../../assuntos/core/models/assunto.model';
import { EstatisticaService } from '../../core/services/estatistica.service';
import { BaseEstatistica } from '../../core/shared/contexto-estatistica';
import { EstatisticaFilter as EstatisticaFilterDto } from '../../core/dtos/estatistica-filter.dto';
import { PainelEstatisticas } from '../../core/models/painel-estatisticas.model';
import { GranularidadeTemporal } from '../../core/enums/granularidade-temporal.enum';
import { EstatisticaFilter as EstatisticaFilterComponent } from '../estatistica-filter/estatistica-filter';
import { EstatisticaKpiCards } from '../estatistica-kpi-cards/estatistica-kpi-cards';
import { GraficoAcertosErros } from '../grafico-acertos-erros/grafico-acertos-erros';
import { GraficoDesempenhoGrupo } from '../grafico-desempenho-grupo/grafico-desempenho-grupo';
import { GraficoEvolucao } from '../grafico-evolucao/grafico-evolucao';
import { RankingPontosFracos } from '../ranking-pontos-fracos/ranking-pontos-fracos';
import { AnaliseTempo } from '../analise-tempo/analise-tempo';
import { EstatisticaVazia } from '../estatistica-vazia/estatistica-vazia';

//Externo
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-estatisticas-page',
  imports: [
    //Aplicação
    LayoutBasePages,
    EstatisticaFilterComponent,
    EstatisticaKpiCards,
    GraficoAcertosErros,
    GraficoDesempenhoGrupo,
    GraficoEvolucao,
    RankingPontosFracos,
    AnaliseTempo,
    EstatisticaVazia,

    //Externo
    CardModule,
    MessageModule,
  ],
  templateUrl: './estatisticas-page.html',
})
export class EstatisticasPage extends ListBase implements OnInit {
  private readonly estatisticaService = inject(EstatisticaService);

  protected readonly base = signal<BaseEstatistica>({
    historicos: [],
    contexto: { nomesMateria: new Map(), nomesAssunto: new Map() },
  });
  protected readonly carregado = signal(false);
  protected readonly granularidade = signal<GranularidadeTemporal>(GranularidadeTemporal.DIA);

  protected readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  /** Converte os objetos do form (Materia, Assunto[], SelectOption) em ids/valores. */
  protected readonly filtro = computed<EstatisticaFilterDto>(() => {
    const value = this.formValue();

    return {
      dataInicioPeriodoConsulta: value.dataInicioPeriodoConsulta
        ? (value.dataInicioPeriodoConsulta as Date).toISOString()
        : null,
      dataFimPeriodoConsulta: value.dataFimPeriodoConsulta
        ? (value.dataFimPeriodoConsulta as Date).toISOString()
        : null,
      idMateria: value.idMateria?.id ?? null,
      idsAssuntos: value.idsAssuntos?.map((a: Assunto) => a.id) ?? null,
      dificuldade: value.dificuldade?.value ?? null,
    };
  });

  protected readonly historicosFiltrados = computed(() =>
    this.estatisticaService.filtrar(this.base().historicos, this.filtro()),
  );

  protected readonly granularidadeEfetiva = computed(() =>
    this.estatisticaService.sugerirGranularidade(this.historicosFiltrados(), this.granularidade()),
  );

  protected readonly granularidadePromovida = computed(
    () => this.granularidadeEfetiva() !== this.granularidade(),
  );

  protected readonly painel = computed<PainelEstatisticas>(() =>
    this.estatisticaService.montarPainel(
      this.historicosFiltrados(),
      this.base().contexto,
      this.granularidadeEfetiva(),
    ),
  );

  protected readonly semHistoricoAlgum = computed(
    () => this.carregado() && this.base().historicos.length === 0,
  );
  protected readonly semResultadoNoFiltro = computed(
    () => this.carregado() && this.base().historicos.length > 0 && this.painel().vazio,
  );

  constructor() {
    super();
    this.createForm(); // ANTES do toSignal acima (ordem importa)
  }

  async ngOnInit(): Promise<void> {
    await this.carregar();
  }

  createForm(): void {
    this.form = this.fb.group({
      dataInicioPeriodoConsulta: [null],
      dataFimPeriodoConsulta: [null],
      idMateria: [null],
      idsAssuntos: [[]],
      dificuldade: [null],
    });
  }

  protected async carregar(): Promise<void> {
    this.base.set(await this.estatisticaService.carregarBase());
    this.carregado.set(true);
  }

  protected onLimparFiltros(): void {
    this.form.reset();
    this.form.updateValueAndValidity();
  }

  protected onIrParaResolverQuestoes(): void {
    this.router.navigate(['/resolver-questoes']);
  }
}
