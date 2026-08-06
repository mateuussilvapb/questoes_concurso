import { Component, computed, inject, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ListBase } from '../../../../shared/components/list-base/list-base';
import { Questao } from '../../../questoes/core/models/questao.model';
import { Banca } from '../../core/models/banca.model';
import { BancaService } from '../../core/services/banca.service';

@Component({
  selector: 'app-banca-card-presentation',
  imports: [
    //Externo
    TagModule,
    CardModule,
    ButtonModule,
    TooltipModule,
  ],
  templateUrl: './banca-card-presentation.html',
  styleUrls: ['./banca-card-presentation.scss'],
})
export class BancaCardPresentation extends ListBase {
  private readonly bancaService = inject(BancaService);

  banca = input.required<Banca>();
  questoesRelacionadas = input.required<Questao[]>();

  exclusaoConcluida = output<boolean>();

  getTextQuestoesRelacionadas = computed(() => {
    if (this.questoesRelacionadas().length == 1) {
      return '1 Questão';
    }
    return `${this.questoesRelacionadas().length} Questões`;
  });

  onEditar() {
    this.router.navigate(['banca', 'edicao', this.banca().id]);
  }

  onExcluir() {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir esta banca?<br>A ação não poderá ser desfeita.',
      header: 'Confirma?',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.excluir(),
    });
  }

  async excluir(): Promise<void> {
    try {
      await this.bancaService.remover(this.banca().id);
      this.messageService.showSuccess('Banca excluída com sucesso!');
      this.exclusaoConcluida.emit(true);
    } catch (e: any) {
      console.error(e);
      const mensagem = e?.message ?? 'Erro ao excluir uma banca. Tente novamente';
      this.messageService.showError(mensagem);
      this.submitting.set(false);
      return;
    }
  }
}
