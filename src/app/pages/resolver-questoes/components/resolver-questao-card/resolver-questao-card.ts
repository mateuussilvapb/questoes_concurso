import { LayoutService } from './../../../../core/services/layout.service';
//Angular
import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

//Aplicação
import { Util } from '../../../../shared/util/util';
import { MessageService } from '../../../../shared/services/message.service';
import { Materia } from '../../../materias/core/models/materia.model';
import { MateriaService } from '../../../materias/core/services/materia.service';
import { Alternativa } from '../../../questoes/alternativas/core/models/alternativa.model';
import {
  NIVEL_DIFICULDADE_LABEL,
  STYLE_CLASS_TAG_DIFICULDADE_DARK,
  STYLE_CLASS_TAG_DIFICULDADE_LIGHT,
} from '../../../questoes/core/enums/nivel-dificuldade.enum';
import { ResolverQuestoes } from '../../core/models/resolver-questoes.model';
import { ThemeService } from './../../../../core/services/theme.service';
import { Questao } from '../../../questoes/core/models/questao.model';
import { QuestaoService } from '../../../questoes/core/services/questao.service';
import { QuestaoFormPage } from '../../../questoes/components/questao-form-page/questao-form-page';
import { FormDialogData } from '../../../../shared/components/form-base/form-base';

//Externo
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogService } from 'primeng/dynamicdialog';
import { DialogComentario } from '../../../questoes/components/dialog-comentario/dialog-comentario';
import { DialogEditarComentario } from '../../../questoes/components/dialog-editar-comentario/dialog-editar-comentario';

export interface AlternativaResolucao extends Alternativa {
  eliminada: boolean;
  selecionada: boolean;
}

export enum EstadoAlternativa {
  Normal,
  Eliminada,
  Correta,
  ErradaSelecionada,
  ErradaNaoSelecionada,
}

@Component({
  selector: 'app-resolver-questao-card',
  imports: [
    //Angular
    CommonModule,

    //Externo
    TagModule,
    CardModule,
    TooltipModule,
    ButtonModule,
  ],
  templateUrl: './resolver-questao-card.html',
  styleUrls: ['./resolver-questao-card.scss'],
})
export class ResolverQuestaoCard {
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly themeService = inject(ThemeService);
  private readonly dialogService = inject(DialogService);
  private readonly layoutService = inject(LayoutService);
  private readonly materiaService = inject(MateriaService);
  private readonly questaoService = inject(QuestaoService);
  private readonly messageService = inject(MessageService);

  finalizado = input.required<boolean>();
  ultimaQuestao = input.required<boolean>();
  primeiraQuestao = input.required<boolean>();
  questao = input.required<ResolverQuestoes>();

  proximaQuestao = output();
  questaoAnterior = output();
  finalizarRespostas = output();
  respondeu = output<{ alternativaId: string; correta: boolean }>();
  questaoAtualizada = output<Questao>();
  comentarioAtualizado = output<Questao>();

  alternativaSelecionada = signal<AlternativaResolucao | null>(null);

  isDarkMode = computed(() => this.themeService.isDarkMode());
  dificuldadeQuestao = computed(() => this.questao().questao.nivelDificuldade);
  labelDificuldade = computed(() => NIVEL_DIFICULDADE_LABEL[this.dificuldadeQuestao()]);
  materia = signal<Materia | null>(null);

  feedback = computed(() => {
    if (!this.questao().resolvida) return null;

    return this.questao().correta
      ? {
          icon: 'pi pi-check',
          text: 'Resposta Correta!',
          bg: 'green',
        }
      : {
          icon: 'pi pi-times',
          text: 'Resposta Incorreta!',
          bg: 'red',
        };
  });

  classByNivelDificuldade = computed(() => {
    return this.isDarkMode()
      ? STYLE_CLASS_TAG_DIFICULDADE_DARK[this.dificuldadeQuestao()]
      : STYLE_CLASS_TAG_DIFICULDADE_LIGHT[this.dificuldadeQuestao()];
  });

  enunciadoBypassSanitizer = computed(() =>
    Util.bypassSanitizerHtml(this.questao().questao.enunciado, this.sanitizer),
  );

  alternativaBypassSanitizer(textoAlternativa: string) {
    return Util.bypassSanitizerHtml(textoAlternativa, this.sanitizer);
  }

  alternativas = signal<AlternativaResolucao[]>([]);

  constructor() {
    this.configureAlternativas();
    this.configureMateria();
  }

  configureAlternativas() {
    effect(() => {
      this.alternativas.set(
        this.questao().questao.alternativas.map((q) => ({
          ...q,
          eliminada: false,
          selecionada: false,
        })),
      );
    });
  }

  configureMateria() {
    effect(() => {
      const idMateria = this.questao().questao.idMateria;

      this.materiaService.buscarPorId(idMateria).then((materia) => this.materia.set(materia));
    });
  }

  mapIndexToLetter(index: number): string {
    return Util.mapIndexToLetter(index);
  }

  toggleEliminada(alternativa: AlternativaResolucao) {
    this.alternativas.update((lista) =>
      lista.map((a) => (a.id === alternativa.id ? { ...a, eliminada: !a.eliminada } : a)),
    );
  }
  private getEstadoAlternativa(alternativa: AlternativaResolucao): EstadoAlternativa {
    const resolvida = this.questao().resolvida;
    const selecionada = this.alternativaSelecionada();

    // Definição das regras na ordem de prioridade (de cima para baixo)
    const regras: [() => boolean, EstadoAlternativa][] = [
      [() => alternativa.eliminada, EstadoAlternativa.Eliminada],
      [() => resolvida && alternativa.correta, EstadoAlternativa.Correta],
      [() => resolvida && selecionada?.id === alternativa.id, EstadoAlternativa.ErradaSelecionada],
      [() => resolvida, EstadoAlternativa.ErradaNaoSelecionada],
    ];

    // Encontra a primeira regra que seja verdadeira
    const regraCorrespondente = regras.find(([predicado]) => predicado());

    // Se nenhuma regra bater, cai no estado padrão (Normal)
    return regraCorrespondente ? regraCorrespondente[1] : EstadoAlternativa.Normal;
  }

  getAlternativaClasses(alternativa: AlternativaResolucao): string {
    const estado = this.getEstadoAlternativa(alternativa);

    // Mapeamento direto do Estado para a classe CSS do PrimeFlex
    const classesPorEstado: Record<EstadoAlternativa, string> = {
      [EstadoAlternativa.Eliminada]: 'line-through text-400 border-200',
      [EstadoAlternativa.Correta]: 'border-green-600 text-green-600',
      [EstadoAlternativa.ErradaSelecionada]: 'border-red-600 text-red-600',
      [EstadoAlternativa.ErradaNaoSelecionada]: 'line-through text-400 border-200',
      [EstadoAlternativa.Normal]:
        'border-300 hover:border-teal-400 cursor-pointer transition-linear transition-duration-200',
    };

    return classesPorEstado[estado];
  }

  onSelectQuestao(alternativa: AlternativaResolucao) {
    if (alternativa.eliminada || this.questao().resolvida) return;
    this.alternativaSelecionada.set(alternativa);
    this.respondeu.emit({
      alternativaId: alternativa.id,
      correta: alternativa.correta,
    });
  }

  finalizar() {
    if (this.finalizado()) {
      this.finalizarRespostas.emit();
    }
  }

  proxima() {
    this.proximaQuestao.emit();
  }

  anterior() {
    this.questaoAnterior.emit();
  }

  onViewComentario() {
    this.dialogService.open(DialogComentario, {
      width: this.layoutService.isMobile() ? '100vw' : '50vw',
      closeOnEscape: true,
      data: { comentario: this.questao().questao.observacao?.observacoes ?? '' },
      contentStyle: { overflow: 'auto' },
      maximizable: this.layoutService.isMobile(),
      header: `Comentário`,
      draggable: false,
      closable: true,
    });
  }

  onEditarComentario() {
    const ref = this.dialogService.open(DialogEditarComentario, {
      header: 'Comentário',
      width: this.layoutService.isMobile() ? '100vw' : '50vw',
      closeOnEscape: true,
      data: { comentario: this.questao().questao.observacao?.observacoes ?? '' },
      contentStyle: { overflow: 'auto' },
      maximizable: this.layoutService.isMobile(),
      draggable: false,
      closable: true,
    });

    ref?.onClose.subscribe(async (comentario?: string) => {
      if (comentario === undefined) {
        return;
      }

      try {
        const questaoAtualizada = await this.questaoService.atualizarAnotacoes(
          this.questao().questao.id,
          { observacoes: comentario, favorita: this.questao().questao.observacao?.favorita ?? false },
        );
        this.messageService.showSuccess('Comentário salvo com sucesso.');
        this.comentarioAtualizado.emit(questaoAtualizada);
      } catch (e: any) {
        console.error(e);
        const mensagem = e?.message ?? 'Erro ao salvar comentário. Tente novamente';
        this.messageService.showError(mensagem);
      }
    });
  }

  onEditarQuestao() {
    const ref = this.dialogService.open(QuestaoFormPage, {
      header: 'Editar Questão',
      width: this.layoutService.isMobile() ? '100vw' : '70vw',
      closeOnEscape: true,
      draggable: false,
      closable: true,
      maximizable: this.layoutService.isMobile(),
      contentStyle: { overflow: 'auto' },
      data: { mode: 'edicao', id: this.questao().questao.id } satisfies FormDialogData,
    });

    ref?.onClose.subscribe((questaoAtualizada?: Questao) => {
      if (!questaoAtualizada) {
        return;
      }
      this.questaoAtualizada.emit(questaoAtualizada);
    });
  }
}
