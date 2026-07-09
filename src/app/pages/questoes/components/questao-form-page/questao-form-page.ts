//Angular
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';

//Aplicação
import { AutocompleteMateria } from '../../../../shared/components/autocomplete-materia/autocomplete-materia';
import { FormBase } from '../../../../shared/components/form-base/form-base';
import { FormLabel } from '../../../../shared/components/form-label/form-label';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';
import { Loading } from '../../../../shared/components/loading/loading';
import { MultiselectAssunto } from '../../../../shared/components/multiselect-assunto/multiselect-assunto';
import { SelectOption, Util } from '../../../../shared/util/util';
import { AssuntoService } from '../../../assuntos/core/services/assunto.service';
import { Materia } from '../../../materias/core/models/materia.model';
import { MateriaService } from '../../../materias/core/services/materia.service';
import { CreateQuestaoDto } from '../../core/dtos/create-questao.dto';
import { UpdateQuestaoDto } from '../../core/dtos/update-questao.dto';
import { OPCOES_NIVEL_DIFICULDADE } from '../../core/enums/nivel-dificuldade.enum';
import { OPCOES_TIPO_QUESTAO, TipoQuestao } from '../../core/enums/tipo-questao.enum';
import { Questao } from '../../core/models/questao.model';
import { QuestaoService } from '../../core/services/questao.service';
import { Alternativa } from '../alternativa/alternativa';
import { minLengthHtmlTextValidator } from '../../../../shared/custom-validators/min-length-html-text-validator';
import { ObservacoesQuestoes } from '../../core/observacoes-questoes/models/observacoes-questoes-model';

//Externo
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { EditorModule } from 'primeng/editor';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { pairwise, startWith } from 'rxjs';

@Component({
  selector: 'app-questao-form-page',
  imports: [
    //Angular
    FormsModule,
    CommonModule,
    ReactiveFormsModule,

    //Aplicação
    Loading,
    FormLabel,
    Alternativa,
    LayoutBasePages,
    MultiselectAssunto,
    AutocompleteMateria,

    //Externos
    CardModule,
    EditorModule,
    ButtonModule,
    SelectModule,
    TooltipModule,
    InputTextModule,
    AutoCompleteModule,
  ],
  templateUrl: './questao-form-page.html',
})
export class QuestaoFormPage extends FormBase implements OnInit {
  // Services
  private readonly materiaService = inject(MateriaService);
  private readonly assuntoService = inject(AssuntoService);
  private readonly questaoService = inject(QuestaoService);

  // Signals
  readonly questao = signal<Questao | null>(null);
  readonly materiaSelecionada = signal<string | null>(null);
  readonly tipoQuestaoMultiplaEscolha = computed(
    () => this.tipoQuestao()?.value === TipoQuestao.MULTIPLA_ESCOLHA,
  );
  // Computed
  title = computed<string>(() => {
    const modes = [
      { active: this.isViewMode(), label: 'Visualizar Questão' },
      { active: this.isEditMode(), label: 'Editar Questão' },
      { active: this.isCreateMode(), label: 'Cadastrar Questão' },
    ];

    return modes.find((mode) => mode.active)?.label ?? 'Teste';
  });

  subtitle = computed<string>(() => {
    const modes = [
      { active: this.isViewMode(), label: 'Visualize os dados da Questão' },
      { active: this.isEditMode(), label: 'Edite os dados da Questão' },
      { active: this.isCreateMode(), label: 'Cadastre uma nova Questão' },
    ];

    return modes.find((mode) => mode.active)?.label ?? 'Teste';
  });

  // Error Messages
  errorEnunciadoMessages: Record<string, string> = {
    required: 'O enunciado é obrigatório',
    minlength: 'O enunciado deve ter, no mínimo, 10 caracteres',
  };

  errorMateriaMessages: Record<string, string> = {
    required: 'A matéria é obrigatória',
  };

  errorAssuntoMessages: Record<string, string> = {
    required: 'O assunto é obrigatório',
  };

  errorDificuldadeMessages: Record<string, string> = {
    required: 'A dificuldade é obrigatória',
  };

  errorTipoQuestaoMessages: Record<string, string> = {
    required: 'O tipo de questão é obrigatório',
  };

  errorAlternativasMessages: Record<string, string> = {
    required: 'As alternativas são obrigatórias',
    minlength: 'As alternativas são obrigatórias',
  };

  errorComentariosMessages: Record<string, string> = {
    minlength: 'Os comentários devem ter, no mínimo, 5 caracteres',
  };

  // Options
  readonly dificuldades = OPCOES_NIVEL_DIFICULDADE;
  readonly tiposQuestao = OPCOES_TIPO_QUESTAO;

  ngOnInit(): void {
    this.createForm();
    if (!this.isCreateMode()) {
      this.getQuestaoAndHandle();
    }
    if (!this.isViewMode()) {
      this.disableDependentsFields();
      this.subscribeFields();
    }
    if (this.isCreateMode()) {
      this.adicionarAlternativa();
      this.adicionarAlternativa();
    }
  }

  disableDependentsFields() {
    this.form.get('assuntos')?.disable();
  }

  subscribeFields() {
    this.subscribeMateriaField();
    this.subscribeTipoQuestaoField();
  }

  subscribeMateriaField() {
    if (!this.materiaControl) {
      return;
    }

    this.materiaControl.valueChanges
      .pipe(startWith(this.materiaControl.value), pairwise())
      .subscribe(([antigo, novo]: [Materia | null, Materia | null]) => {
        this.handleMateriaChange(antigo, novo);
      });
  }

  private subscribeTipoQuestaoField() {
    this.tipoQuestao.set(this.tipoQuestaoControl.value);

    this.tipoQuestaoControl.valueChanges.subscribe((value) => {
      this.tipoQuestao.set(value);
      this.alternativasFormArray.clear();
      if (value?.value === TipoQuestao.VF) {
        this.adicionarAlternativa('', 'Verdadeiro', false);
        this.adicionarAlternativa('', 'Falso', false);
      } else {
        this.adicionarAlternativa();
        this.adicionarAlternativa();
      }
    });
  }

  handleMateriaChange(antigo: Materia | null, novo: Materia | null) {
    if (!novo) {
      this.materiaSelecionada.set(null);
      this.assuntosControl?.setValue([]);
      this.assuntosControl?.markAsUntouched();
      this.assuntosControl?.markAsPristine();
      this.assuntosControl?.updateValueAndValidity();
      this.assuntosControl?.disable();
      return;
    }
    if (novo) {
      this.materiaSelecionada.set(novo.id);
      this.assuntosControl?.enable();
      if (antigo && antigo.id !== novo.id) {
        this.form.get('assuntos')?.setValue([]);
        return;
      }
    }
  }

  createForm() {
    this.form = this.fb.group({
      enunciado: [
        { value: '', disabled: this.isViewMode() },
        [Validators.required, minLengthHtmlTextValidator(10)],
      ],
      materia: [{ value: null, disabled: this.isViewMode() }, [Validators.required]],
      dificuldade: [{ value: null, disabled: this.isViewMode() }, [Validators.required]],
      assuntos: [{ value: null, disabled: this.isViewMode() }, [Validators.required]],
      tipoQuestao: [{ value: null, disabled: this.isViewMode() }, [Validators.required]],
      alternativas: this.fb.array<FormGroup>([]),
      comentario: [{ value: '', disabled: this.isViewMode() }, [minLengthHtmlTextValidator(5)]],
    });
  }

  adicionarAlternativa(id = '', texto = '', correta = false): void {
    if (this.canAddAlternativa()) {
      this.alternativasFormArray.push(this.createGroupAlternativa(id, texto, correta));
    }
  }

  canAddAlternativa(): boolean {
    return (
      (this.tipoQuestaoMultiplaEscolha() && this.alternativasFormArray.length < 5) ||
      (!this.tipoQuestaoMultiplaEscolha() && this.alternativasFormArray.length < 2)
    );
  }

  disableAdicionarAlternativa(): boolean {
    return !this.canAddAlternativa();
  }

  removerAlternativa(index: number): void {
    if (this.alternativasFormArray.length > 2) {
      this.alternativasFormArray.removeAt(index);
    }
  }

  createGroupAlternativa(id = '', texto = '', correta = false): FormGroup {
    return this.fb.group({
      id: [id],
      texto: [texto, [Validators.required]],
      correta: [correta],
    });
  }

  selecionarAlternativaCorreta(index: number): void {
    this.marcarTodasAlternativasFalsas();
    const alternativa = this.alternativasFormArray.at(index);
    if (alternativa) {
      alternativa.get('correta')?.setValue(true);
    }
  }

  marcarTodasAlternativasFalsas(): void {
    this.alternativasFormArray.controls.forEach((alternativa) => {
      alternativa.get('correta')?.setValue(false);
    });
  }

  asFormGroup(control: any): FormGroup {
    return control as FormGroup;
  }

  getQuestaoAndHandle() {
    this.questao.set(this.questaoService.buscarPorId(this.pageId()));
    this.patchValueOnForm();
  }

  patchValueOnForm() {
    const materia = this.materiaService.buscarPorId(this.questao()?.idMateria ?? '');
    const assuntos = this.assuntoService
      .listar()
      .filter((x) => this.questao()?.idsAssuntos.includes(x.id));
    const nivelDificuldade = this.dificuldades.find(
      (x) => x.value == this.questao()?.nivelDificuldade,
    );
    const tipoQuestao = this.tiposQuestao.find((x) => x.value == this.questao()?.tipo);

    this.form.patchValue({
      enunciado: this.questao()?.enunciado,
      materia: materia,
      dificuldade: nivelDificuldade,
      assuntos: assuntos,
      tipoQuestao: tipoQuestao,
      comentario: this.questao()?.observacao?.observacoes,
    });

    setTimeout(() => {
      this.materiaControl?.updateValueAndValidity();
      this.addAlternativasOnPatchValueForm();
    });
  }

  addAlternativasOnPatchValueForm() {
    this.questao()?.alternativas.forEach((alternativa) => {
      this.adicionarAlternativa(alternativa.id, alternativa.texto, alternativa.correta);
    });
  }

  onSubmit() {
    if (this.form.valid) {
      if (!this.alternativaCorretaSelecionada()) {
        this.messageService.showError('Selecione a alternativa correta.');
        return;
      }
      this.submitting.set(true);
      if (this.isCreateMode()) {
        this.onCreate();
        return;
      }
      this.onUpdate();
      return;
    }
    this.form.markAllAsDirty();
    this.form.markAllAsTouched();
    this.messageService.showInfo('Formulário inválido. Preencha o formulário corretamente.');
  }

  alternativaCorretaSelecionada(): boolean {
    return this.alternativasFormArray.controls.some(
      (alternativa) => alternativa.get('correta')?.value === true,
    );
  }

  onCreate() {
    const rawValue = this.form.getRawValue();

    const dto: CreateQuestaoDto = {
      enunciado: rawValue.enunciado,
      idMateria: rawValue.materia?.id ?? '',
      observacao: this.checkAndGetObservacoes(rawValue),
      idsAssuntos: rawValue.assuntos?.map((a: any) => a.id) ?? [],
      nivelDificuldade: rawValue.dificuldade.value ?? null,
      tipo: rawValue.tipoQuestao.value ?? null,
      alternativas: rawValue.alternativas,
      status: { favorita: false, revisada: false, marcadaParaRevisao: false },
    };

    try {
      this.questaoService.criar(dto);
      this.submitting.set(false);
      this.messageService.showSuccess(
        'Questão criada com sucesso. Você será redirecionado para listagem.',
      );
      this.confirmationService.confirm({
        message: 'Deseja continuar adicionando questões?',
        header: 'Questão criada com sucesso!',
        icon: 'pi pi-question-circle',
        acceptButtonStyleClass: 'p-button-primary',
        rejectButtonStyleClass: 'p-button-secondary',
        acceptLabel: 'Continuar',
        rejectLabel: 'Voltar para listagem',
        accept: () => {
          this.form.get('enunciado')?.setValue('');
          this.alternativasFormArray.controls.forEach((alternativa) => {
            alternativa.get('texto')?.setValue('');
          });
          this.marcarTodasAlternativasFalsas();
        },
        reject: () => this.onVoltar(),
      });
      return;
    } catch (e: any) {
      console.error(e);
      const mensagem = e?.message ?? 'Erro ao criar questão. Tente novamente';
      this.messageService.showError(mensagem);
      this.submitting.set(false);
      return;
    }
  }

  onUpdate() {
    const rawValue = this.form.getRawValue();
    const dto: UpdateQuestaoDto = {
      id: this.questao()?.id ?? '',
      enunciado: rawValue.enunciado,
      idMateria: rawValue.materia?.id ?? '',
      observacao: this.checkAndGetObservacoes(rawValue),
      idsAssuntos: rawValue.assuntos?.map((a: any) => a.id) ?? [],
      nivelDificuldade: rawValue.dificuldade.value ?? null,
      tipo: rawValue.tipoQuestao.value ?? null,
      alternativas: rawValue.alternativas,
      status: {
        favorita: this.questao()?.status.favorita ?? false,
        revisada: this.questao()?.status.revisada ?? false,
        marcadaParaRevisao: this.questao()?.status.marcadaParaRevisao ?? false,
      },
    };

    try {
      this.questaoService.atualizar(dto);
      this.submitting.set(false);
      this.messageService.showSuccess(
        'Questão atualizada com sucesso. Você será redirecionado para listagem.',
      );
      this.onVoltar();
      return;
    } catch (e: any) {
      console.error(e);
      const mensagem = e?.message ?? 'Erro ao atualizar questão. Tente novamente';
      this.messageService.showError(mensagem);
      this.submitting.set(false);
      return;
    }
  }

  checkAndGetObservacoes(rawValue: any): ObservacoesQuestoes {
    let obj: ObservacoesQuestoes = { observacoes: '', favorita: false };
    if (!rawValue.comentario) return obj;

    const checkIfExistsComment = !!Util.htmlToText(rawValue.comentario).length;
    if (!checkIfExistsComment) return obj;

    obj.observacoes = rawValue.comentario;
    obj.favorita = this.questao()?.observacao.favorita ?? false;
    return obj;
  }

  onVoltar() {
    this.router.navigate(['/questao']);
  }

  // Get Controls and Arrays
  get enunciadoControl(): FormControl {
    return this.form.get('enunciado') as FormControl;
  }

  get materiaControl(): FormControl {
    return this.form.get('materia') as FormControl;
  }

  get dificuldadeControl(): FormControl {
    return this.form.get('dificuldade') as FormControl;
  }

  get assuntosControl(): FormArray {
    return this.form.get('assuntos') as FormArray;
  }

  get tipoQuestaoControl(): FormControl {
    return this.form.get('tipoQuestao') as FormControl;
  }

  get comentarioControl(): FormControl {
    return this.form.get('comentario') as FormControl;
  }

  get alternativasFormArray(): FormArray<FormGroup> {
    return this.form.get('alternativas') as FormArray<FormGroup>;
  }

  // ValueChanges para uso em signals/computed
  readonly tipoQuestao = signal<SelectOption<TipoQuestao> | null>(null);
}
