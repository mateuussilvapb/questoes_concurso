//Angular
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { Component, computed, inject, input, output } from '@angular/core';

//Aplicação
import {
  NIVEL_DIFICULDADE_LABEL,
  STYLE_CLASS_TAG_DIFICULDADE_DARK,
  STYLE_CLASS_TAG_DIFICULDADE_LIGHT,
} from './../../core/enums/nivel-dificuldade.enum';
import { Util } from '../../../../shared/util/util';
import { Questao } from '../../core/models/questao.model';
import { QuestaoService } from '../../core/services/questao.service';
import { Assunto } from '../../../assuntos/core/models/assunto.model';
import { Banca } from '../../../bancas/core/models/banca.model';
import { Materia } from '../../../materias/core/models/materia.model';
import { ThemeService } from '../../../../core/services/theme.service';
import { TIPO_QUESTAO_LABEL } from '../../core/enums/tipo-questao.enum';
import { DialogComentario } from '../dialog-comentario/dialog-comentario';
import { LayoutService } from './../../../../core/services/layout.service';
import { ListBase } from '../../../../shared/components/list-base/list-base';

//Externo
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule, ButtonSeverity } from 'primeng/button';

@Component({
  selector: 'app-questao-card-presentation',
  imports: [
    //Angular
    CommonModule,

    //Externo
    TagModule,
    CardModule,
    ButtonModule,
    TooltipModule,
  ],
  templateUrl: './questao-card-presentation.html',
  styleUrls: ['./questao-card-presentation.scss'],
})
export class QuestaoCardPresentation extends ListBase {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly themeService = inject(ThemeService);
  private readonly layoutService = inject(LayoutService);
  private readonly questaoService = inject(QuestaoService);

  questao = input.required<Questao>();
  materia = input.required<Materia>();
  banca = input<Banca | undefined>(undefined);
  assuntosAssociados = input.required<Assunto[]>();

  exclusaoConcluida = output<boolean>();
  toogleStatus = output<string>();

  onEditar() {
    this.router.navigate(['questao', 'edicao', this.questao().id]);
  }

  onExcluir() {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir esta questão?<br>A ação não poderá ser desfeita.',
      header: 'Confirma?',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.excluir(),
    });
  }

  excluir() {
    try {
      this.questaoService.remover(this.questao().id);
      this.messageService.showSuccess('Questão excluída com sucesso!');
      this.exclusaoConcluida.emit(true);
    } catch (e: any) {
      console.error(e);
      const mensagem = e?.message ?? 'Erro ao excluir uma questão. Tente novamente';
      this.messageService.showError(mensagem);
      this.submitting.set(false);
      return;
    }
  }

  enunciadoBypassSanitizer = computed(() =>
    Util.bypassSanitizerHtml(this.questao().enunciado, this.sanitizer),
  );

  // Botão Comentário
  onViewComentario() {
    this.dialogService.open(DialogComentario, {
      width: this.layoutService.isMobile() ? '100vw' : '50vw',
      closeOnEscape: true,
      data: { comentario: this.questao().observacao?.observacoes ?? '' },
      contentStyle: { overflow: 'auto' },
      maximizable: this.layoutService.isMobile(),
      header: `Comentário`,
      draggable: false,
      closable: true,
    });
  }

  //Botão Revisão
  isQuestaoMarcadaParaRevisao = computed<boolean>(() => this.questao().status.marcadaParaRevisao);

  onToggleRevisao() {
    try {
      this.questaoService.toggleMarcadaParaRevisao(this.questao().id);
      const statusMarcadaParaRevisaoAtual = this.questao().status.marcadaParaRevisao;
      this.toogleStatus.emit(this.questao().id);
      const message = statusMarcadaParaRevisaoAtual
        ? 'Questão desmarcada para revisão!'
        : 'Questão marcada para revisão!';
      this.messageService.showSuccess(message, 'Sucesso!');
    } catch (e: any) {
      const mensagem = e?.message ?? 'Erro ao alterar status da questão. Tente novamente.';
      this.messageService.showError(mensagem);
      this.submitting.set(false);
      return;
    }
  }

  labelBtnRevisao = computed<string>(() => {
    if (this.isQuestaoMarcadaParaRevisao()) {
      return 'Desmarcar para revisão';
    }
    return 'Marcar para revisão';
  });

  severityBtnRevisao = computed<ButtonSeverity>(() => {
    if (this.isQuestaoMarcadaParaRevisao()) {
      return 'primary';
    }
    return 'contrast';
  });

  //Botão Favoritar
  isQuestaoMarcadaComoFavorita = computed<boolean>(() => this.questao().status.favorita);

  onToggleFavoritar() {
    try {
      this.questaoService.toggleFavorita(this.questao().id);
      const statusFavoritaAtual = this.questao().status.favorita;
      this.toogleStatus.emit(this.questao().id);
      const message = statusFavoritaAtual ? 'Questão desfavoritada!' : 'Questão favoritada!';
      this.messageService.showSuccess(message, 'Sucesso!');
    } catch (e: any) {
      const mensagem = e?.message ?? 'Erro ao alterar status da questão. Tente novamente.';
      this.messageService.showError(mensagem);
      this.submitting.set(false);
      return;
    }
  }

  labelBtnFavoritar = computed<string>(() => {
    if (this.isQuestaoMarcadaComoFavorita()) {
      return 'Desmarcar como favorita';
    }
    return 'Marcar como favorita';
  });

  severityBtnFavoritar = computed<ButtonSeverity>(() => {
    if (this.isQuestaoMarcadaComoFavorita()) {
      return 'warn';
    }
    return 'contrast';
  });

  // Tag Dificuldade
  dificuldadeQuestao = computed(() => this.questao().nivelDificuldade);

  classByNivelDificuldade = computed(() => {
    return this.themeService.isDarkMode()
      ? STYLE_CLASS_TAG_DIFICULDADE_DARK[this.dificuldadeQuestao()]
      : STYLE_CLASS_TAG_DIFICULDADE_LIGHT[this.dificuldadeQuestao()];
  });

  labelDificuldade = computed(() => NIVEL_DIFICULDADE_LABEL[this.dificuldadeQuestao()]);

  // Tag Tipo Questão
  tipoQuestao = computed(() => this.questao().tipo);

  labelTipoQuestao = computed(() => TIPO_QUESTAO_LABEL[this.tipoQuestao()]);
}
