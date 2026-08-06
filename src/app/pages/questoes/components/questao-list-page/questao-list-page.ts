//Angular
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';

//Aplicação
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';
import { ListBase } from '../../../../shared/components/list-base/list-base';
import { InfiniteScrollSentinelDirective } from '../../../../shared/directives/infinite-scroll-sentinel.directive';
import { Assunto } from '../../../assuntos/core/models/assunto.model';
import { AssuntoService } from '../../../assuntos/core/services/assunto.service';
import { Banca } from '../../../bancas/core/models/banca.model';
import { BancaService } from '../../../bancas/core/services/banca.service';
import { Materia } from '../../../materias/core/models/materia.model';
import { MateriaService } from '../../../materias/core/services/materia.service';
import { Questao } from '../../core/models/questao.model';
import { QuestaoService } from '../../core/services/questao.service';
import { QuestaoCardPresentation } from '../questao-card-presentation/questao-card-presentation';
import { QuestaoFilter as QuestaoFilterComponent } from '../questao-filter/questao-filter';
import { QuestaoFilter } from '../../core/dtos/filter-questao.dto';

//Externo
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

const TAMANHO_PAGINA = 20;

@Component({
  selector: 'app-questao-list-page',
  imports: [
    //Angular

    //Aplicação
    LayoutBasePages,
    QuestaoFilterComponent,
    QuestaoCardPresentation,
    InfiniteScrollSentinelDirective,

    //Externo
    CardModule,
    DividerModule,
  ],
  templateUrl: './questao-list-page.html',
})
export class QuestaoListPage extends ListBase implements OnInit {
  private readonly questaoService = inject(QuestaoService);
  private readonly materiaService = inject(MateriaService);
  private readonly assuntoService = inject(AssuntoService);
  private readonly bancaService = inject(BancaService);

  protected searchTerm = signal<string>('');
  protected searchMateriaId = signal<Materia | null>(null);
  protected searchAssuntosIds = signal<Assunto[] | null>(null);
  protected materias = signal<Materia[]>([]);
  protected materiasPorId = computed(() => new Map(this.materias().map((m) => [m.id, m])));
  protected assuntos = signal<Assunto[]>([]);
  protected assuntosPorId = computed(() => new Map(this.assuntos().map((a) => [a.id, a])));
  protected bancas = signal<Banca[]>([]);
  protected bancasPorId = computed(() => new Map(this.bancas().map((b) => [b.id, b])));

  constructor() {
    super();

    this.createForm();

    this.formValue = toSignal(this.form.valueChanges, {
      initialValue: this.form.getRawValue(),
    });

    effect(() => {
      const value = this.formValue();

      const filtro: QuestaoFilter = {
        ...value,
        tipo: value.tipo?.value,
        favorita: value.favorita?.value,
        revisada: value.revisada?.value,
        nivelDificuldade: value.nivelDificuldade?.value,
        marcadaParaRevisao: value.marcadaParaRevisao?.value,
        idMateria: value.idMateria?.id,
        idsAssuntos: value.idsAssuntos?.map((a: Assunto) => a.id),
        idBanca: value.idBanca?.id,
      };

      this.questaoService.pesquisar(filtro).then((questoes) => {
        this.questoes.set(questoes);
        this.itensVisiveis.set(TAMANHO_PAGINA);
      });
    });
  }

  async ngOnInit(): Promise<void> {
    this.materias.set(await this.materiaService.listar());
    this.assuntos.set(await this.assuntoService.listar());
    this.bancas.set(await this.bancaService.listar());
  }

  protected formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  protected questoes = signal<Questao[]>([]);
  protected itensVisiveis = signal(TAMANHO_PAGINA);
  protected questoesVisiveis = computed(() => this.questoes().slice(0, this.itensVisiveis()));

  createForm() {
    this.form = this.fb.group({
      enunciado: [null],
      observacao: [null],
      idMateria: [null],
      idsAssuntos: [[]],
      idBanca: [null],
      tipo: [null],
      nivelDificuldade: [null],
      favorita: [null],
      revisada: [null],
      marcadaParaRevisao: [null],
    });
  }

  getMateriaPorQuestao(questao: Questao): Materia {
    return this.materiasPorId().get(questao.idMateria)!;
  }

  getBancaPorQuestao(questao: Questao): Banca | undefined {
    return questao.idBanca ? this.bancasPorId().get(questao.idBanca) : undefined;
  }

  onLimpar() {
    this.searchMateriaId.set(null);
    this.searchAssuntosIds.set(null);
    this.searchTerm.set('');
  }

  onAddQuestao() {
    this.router.navigate(['questao', 'cadastro']);
  }

  protected carregarMais(): void {
    if (this.itensVisiveis() >= this.questoes().length) {
      return;
    }

    this.itensVisiveis.update((valor) => Math.min(valor + TAMANHO_PAGINA, this.questoes().length));
  }

  getAssuntosAssociados(questao: Questao): Assunto[] {
    const assuntosPorId = this.assuntosPorId();

    return questao.idsAssuntos
      .map((id) => assuntosPorId.get(id))
      .filter((assunto): assunto is Assunto => assunto !== undefined);
  }
}
