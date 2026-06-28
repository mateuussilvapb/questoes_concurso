import { Component, computed, inject, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ListBase } from '../../../../shared/components/list-base/list-base';
import { Assunto } from '../../../assuntos/core/models/assunto.model';
import { Questao } from '../../../questoes/core/models/questao.model';
import { Materia } from '../../core/models/materia.model';
import { MateriaService } from '../../core/services/materia.service';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-materia-card-presentation',
  imports: [
    //Externo
    TagModule,
    CardModule,
    ButtonModule,
    TooltipModule,
  ],
  templateUrl: './materia-card-presentation.html',
})
export class MateriaCardPresentation extends ListBase {
  private readonly materiaService = inject(MateriaService);

  materia = input.required<Materia>();
  assuntosRelacionados = input.required<Assunto[]>();
  questoesRelacionadas = input.required<Questao[]>();

  exclusaoConcluida = output<boolean>();

  getTextAssuntosRelacionados = computed(() => {
    if (this.assuntosRelacionados().length == 1) {
      return '1 Assunto';
    }
    return `${this.assuntosRelacionados().length} Assuntos`;
  });

  getTextQuestoesRelacionadas = computed(() => {
    if (this.questoesRelacionadas().length == 1) {
      return '1 Questão';
    }
    return `${this.questoesRelacionadas().length} Questões`;
  });

  onEditar() {
    this.router.navigate(['materia', 'edicao', this.materia().id]);
  }

  onExcluir() {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir esta matéria?<br>A ação não poderá ser desfeita.',
      header: 'Confirma?',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.excluir(),
    });
  }

  excluir() {
    try {
      this.materiaService.remover(this.materia().id);
      this.messageService.showSuccess('Matéria excluída com sucesso!');
      this.exclusaoConcluida.emit(true);
    } catch (e: any) {
      console.error(e);
      const mensagem = e?.message ?? 'Erro ao excluir uma matéria. Tente novamente';
      this.messageService.showError(mensagem);
      this.submitting.set(false);
      return;
    }
  }
}
