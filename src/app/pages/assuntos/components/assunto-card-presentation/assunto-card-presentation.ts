import { Component, computed, inject, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ListBase } from '../../../../shared/components/list-base/list-base';
import { Questao } from '../../../questoes/core/models/questao.model';
import { Assunto } from '../../core/models/assunto.model';
import { AssuntoService } from '../../core/services/assunto.service';
import { Materia } from '../../../materias/core/models/materia.model';

@Component({
  selector: 'app-assunto-card-presentation',
  imports: [
    //Externo
    TagModule,
    CardModule,
    ButtonModule,
    TooltipModule,
  ],
  templateUrl: './assunto-card-presentation.html',
})
export class AssuntoCardPresentation extends ListBase {
  private readonly assuntoService = inject(AssuntoService);

  assunto = input.required<Assunto>();
  materia = input.required<Materia>();
  questoesRelacionadas = input.required<Questao[]>();

  exclusaoConcluida = output<boolean>();

  getTextQuestoesRelacionadas = computed(() => {
    if (this.questoesRelacionadas().length == 1) {
      return '1 Questão';
    }
    return `${this.questoesRelacionadas().length} Questões`;
  });

  onEditar() {
    this.router.navigate(['assunto', 'edicao', this.assunto().id]);
  }

  onExcluir() {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir este assunto?<br>A ação não poderá ser desfeita.',
      header: 'Confirma?',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.excluir(),
    });
  }

  excluir() {
    try {
      this.assuntoService.remover(this.assunto().id);
      this.messageService.showSuccess('Assunto excluída com sucesso!');
      this.exclusaoConcluida.emit(true);
    } catch (e: any) {
      console.error(e);
      const mensagem = e?.message ?? 'Erro ao excluir um assunto. Tente novamente';
      this.messageService.showError(mensagem);
      this.submitting.set(false);
      return;
    }
  }
}
