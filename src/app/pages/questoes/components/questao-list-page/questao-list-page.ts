//Angular
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, inject, signal } from '@angular/core';

//Aplicação
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';
import { ListBase } from '../../../../shared/components/list-base/list-base';
import { Assunto } from '../../../assuntos/core/models/assunto.model';
import { AssuntoService } from '../../../assuntos/core/services/assunto.service';
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

@Component({
  selector: 'app-questao-list-page',
  imports: [
    //Angular

    //Aplicação
    LayoutBasePages,
    QuestaoFilterComponent,
    QuestaoCardPresentation,

    //Externo
    CardModule,
    DividerModule,
  ],
  templateUrl: './questao-list-page.html',
})
export class QuestaoListPage extends ListBase {
  private readonly questaoService = inject(QuestaoService);
  private readonly materiaService = inject(MateriaService);
  private readonly assuntoService = inject(AssuntoService);

  protected searchTerm = signal<string>('');
  protected searchMateriaId = signal<Materia | null>(null);
  protected searchAssuntosIds = signal<Assunto[] | null>(null);

  constructor() {
    super();

    this.createForm();

    this.formValue = toSignal(this.form.valueChanges, {
      initialValue: this.form.getRawValue(),
    });
  }

  protected formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  protected questoes = computed(() => {
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
    };

    return this.questaoService.pesquisar(filtro);
  });

  createForm() {
    this.form = this.fb.group({
      enunciado: [null],
      observacao: [null],
      idMateria: [null],
      idsAssuntos: [[]],
      tipo: [null],
      nivelDificuldade: [null],
      favorita: [null],
      revisada: [null],
      marcadaParaRevisao: [null],
    });
  }

  getMateriaPorQuestao(questao: Questao): Materia {
    return this.materiaService.buscarPorId(questao.idMateria);
  }

  onLimpar() {
    this.searchMateriaId.set(null);
    this.searchAssuntosIds.set(null);
    this.searchTerm.set('');
  }

  onAddQuestao() {
    this.router.navigate(['questao', 'cadastro']);
  }

  getAssuntosAssociados(questao: Questao) {
    const assuntosAssociados: Array<Assunto> = [];
    questao.idsAssuntos.forEach((id) =>
      assuntosAssociados.push(this.assuntoService.buscarPorId(id)),
    );
    return assuntosAssociados;
  }
}
