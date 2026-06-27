//Angular
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

//Externo
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { AutoComplete, AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';

//Aplicação
import { Assunto } from '../../core/models/assunto.model';
import { AssuntoService } from '../../core/services/assunto.service';
import { CreateAssuntoDto } from '../../core/dtos/create-assunto.dto';
import { UpdateAssuntoDto } from '../../core/dtos/update-assunto.dto';
import { Loading } from '../../../../shared/components/loading/loading';
import { FormBase } from '../../../../shared/components/form-base/form-base';
import { FormLabel } from '../../../../shared/components/form-label/form-label';
import { MateriaService } from '../../../materias/core/services/materia.service';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';
import { Materia } from '../../../materias/core/models/materia.model';
import { required } from '@angular/forms/signals';

@Component({
  selector: 'app-assuntos-form-page',
  imports: [
    //Angular
    FormsModule,
    CommonModule,
    ReactiveFormsModule,

    //Aplicação
    Loading,
    FormLabel,
    LayoutBasePages,

    //Externos
    CardModule,
    ButtonModule,
    TextareaModule,
    InputTextModule,
    AutoCompleteModule,
  ],
  templateUrl: './assuntos-form-page.html',
})
export class AssuntosFormPage extends FormBase implements OnInit {
  private readonly materiaService = inject(MateriaService);
  private readonly assuntoService = inject(AssuntoService);

  assunto = signal<Assunto | null>(null);

  protected searchTerm = signal<string>('');

  protected materias = signal<Materia[]>([]);

  protected readonly materiasFiltradas = signal<Materia[]>([]);

  title = computed<string>(() => {
    const modes = [
      { active: this.isViewMode(), label: 'Visualizar Assunto' },
      { active: this.isEditMode(), label: 'Editar Assunto' },
      { active: this.isCreateMode(), label: 'Cadastrar Assunto' },
    ];

    return modes.find((mode) => mode.active)?.label ?? 'Teste';
  });

  subtitle = computed<string>(() => {
    const modes = [
      { active: this.isViewMode(), label: 'Visualize os dados do Assunto' },
      { active: this.isEditMode(), label: 'Edite os dados do Assunto' },
      { active: this.isCreateMode(), label: 'Cadastre um novo Assunto' },
    ];

    return modes.find((mode) => mode.active)?.label ?? 'Teste';
  });

  errorNomeMessages: Record<string, string> = {
    required: 'O nome é obrigatório',
    minlength: 'O nome deve ter, no mínimo, 5 caracteres',
    maxlength: 'O nome deve ter, no máximo, 100 caracteres',
  };

  errorDescricaoMessages: Record<string, string> = {
    minlength: 'A descrição deve ter, no mínimo, 5 caracteres',
    maxlength: 'A descrição deve ter, no máximo, 500 caracteres',
  };

  errorMateriaMessages: Record<string, string> = {
    required: 'A matéria é obrigatória',
  };

  ngOnInit(): void {
    this.createForm();
    this.consultarMaterias();
    if (!this.isCreateMode()) {
      this.getAssuntoAndHandle();
    }
  }

  createForm() {
    this.form = this.fb.group({
      nome: [
        {
          value: '',
          disabled: this.isViewMode(),
        },
        [Validators.required, Validators.minLength(5), Validators.maxLength(100)],
      ],
      descricao: [
        {
          value: '',
          disabled: this.isViewMode(),
        },
        [Validators.minLength(5), Validators.maxLength(500)],
      ],
      materia: [
        {
          value: null,
          disabled: this.isViewMode(),
        },
        [Validators.required],
      ],
    });
  }

  consultarMaterias() {
    this.materias.set(this.materiaService.listar());
  }

  getAssuntoAndHandle() {
    this.assunto.set(this.assuntoService.buscarPorId(this.pageId()));
    this.patchValueOnForm();
  }

  patchValueOnForm() {
    const materia = this.materiaService.buscarPorId(this.assunto()?.idMateria ?? '');
    this.form.patchValue({
      nome: this.assunto()?.nome,
      descricao: this.assunto()?.descricao,
      materia: materia,
    });
  }

  onSubmit() {
    if (this.form.valid) {
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

  onCreate() {
    const rawValue = this.form.getRawValue();
    const dto: CreateAssuntoDto = {
      nome: rawValue.nome,
      descricao: rawValue.descricao,
      idMateria: rawValue.materia?.id ?? null,
    };

    try {
      this.assuntoService.criar(dto);
      this.submitting.set(false);
      this.messageService.showSuccess(
        'Assunto criado com sucesso. Você será redirecionado para listagem.',
      );
      this.router.navigate(['assunto']);
      return;
    } catch (e: any) {
      console.error(e);
      const mensagem = e?.message ?? 'Erro ao criar assunto. Tente novamente';
      this.messageService.showError(mensagem);
      this.submitting.set(false);
      return;
    }
  }

  onUpdate() {
    const rawValue = this.form.getRawValue();
    const dto: UpdateAssuntoDto = {
      id: this.assunto()?.id ?? '',
      nome: rawValue.nome,
      descricao: rawValue.descricao,
      idMateria: rawValue.materia.id ?? null,
    };

    try {
      this.assuntoService.atualizar(dto);
      this.submitting.set(false);
      this.messageService.showSuccess(
        'Assunto atualizado com sucesso. Você será redirecionado para listagem.',
      );
      this.router.navigate(['assunto']);
      return;
    } catch (e: any) {
      console.error(e);
      const mensagem = e?.message ?? 'Erro ao atualizar assunto. Tente novamente';
      this.messageService.showError(mensagem);
      this.submitting.set(false);
      return;
    }
  }

  searchMateria(event: any) {
    const busca = event?.query?.toLowerCase().trim();

    if (!busca) {
      this.materiasFiltradas.set(this.materias());
      return;
    }

    this.materiasFiltradas.set(this.materias().filter((m) => m.nome.toLowerCase().includes(busca)));
  }

  abrirAutocomplete(ac: AutoComplete) {
    this.searchMateria({ query: '' } as any);

    queueMicrotask(() => {
      ac.show();
    });
  }

  fecharAutocomplete(ac: AutoComplete) {
    this.searchMateria({ query: '' } as any);

    queueMicrotask(() => {
      ac.hide()
    });
  }

  onVoltar() {
    this.router.navigate(['/assunto']);
  }
}
