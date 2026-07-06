//Angular
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, inject, signal } from '@angular/core';

//Aplicação
import { Util } from '../../../../shared/util/util';
import { Assunto } from '../../../assuntos/core/models/assunto.model';
import { ResolverQuestoes } from '../../core/models/resolver-questoes.model';
import { ListBase } from '../../../../shared/components/list-base/list-base';
import { QuestaoFilter } from '../../../questoes/core/dtos/filter-questao.dto';
import { QuestaoService } from './../../../questoes/core/services/questao.service';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';
import { ResolverQuestoesComponent } from '../resolver-questoes-component/resolver-questoes-component';
import { QuestaoFilter as QuestaoFilterComponent } from '../../../questoes/components/questao-filter/questao-filter';

//Externo
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-resolver-questoes-page',
  imports: [
    //Aplicação
    LayoutBasePages,
    QuestaoFilterComponent,
    ResolverQuestoesComponent,

    //Externo
    CardModule,
    DividerModule,
  ],
  templateUrl: './resolver-questoes-page.html',
})
export class ResolverQuestoesPage extends ListBase {
  private readonly questaoService = inject(QuestaoService);

  protected readonly resolverMode = signal<boolean>(false);
  protected readonly questoesResolucao = signal<ResolverQuestoes[]>([]);

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

  questoesLength = computed(() => this.questoes().length);

  onResolverAction() {
    if (this.questoesLength() === 0) {
      this.messageService.showWarning(
        'Não existem questões disponíveis. Altere os filtros ou cadastre questões.',
        'Atenção!',
      );
      return;
    }

    const questoes = Util.shuffle(this.questoes()).map((q) => ({
      questao: q,
      resolvida: false,
      correta: false,
      alternativaId: '',
    }));

    this.questoesResolucao.set(questoes);

    this.resolverMode.set(true);
  }

  textQuantidadeQuestoes = computed(() => {
    if (this.questoesLength() === 1) {
      return `${this.questoesLength()} questão disponível`;
    }
    return `${this.questoesLength()} questões disponíveis`;
  });

  onEncerrar() {
    this.form.reset();
    this.form.updateValueAndValidity();
    this.resolverMode.set(false);
  }

  onRespondeu(event: { questaoId: string; alternativaId: string; correta: boolean }) {
    this.questoesResolucao.update((questoes) =>
      questoes.map((q) =>
        q.questao.id == event.questaoId
          ? { ...q, alternativaId: event.alternativaId, correta: event.correta, resolvida: true }
          : q,
      ),
    );
  }

  onFinalizar() {
    //TODO: implementar lógica de persistência de histórico
    this.resolverMode.set(false);
  }
}
