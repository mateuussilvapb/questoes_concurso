//Angular
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

//Externos
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';

//Aplicação
import { Banca } from '../../core/models/banca.model';
import { BancaService } from '../../core/services/banca.service';
import { Loading } from '../../../../shared/components/loading/loading';
import { CreateBancaDto } from '../../core/dtos/create-banca.dto';
import { UpdateBancaDto } from '../../core/dtos/update-banca.dto';
import { FormBase } from '../../../../shared/components/form-base/form-base';
import { FormLabel } from '../../../../shared/components/form-label/form-label';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';

@Component({
  selector: 'app-bancas-form-page',
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
  ],
  templateUrl: './bancas-form-page.html',
})
export class BancasFormPage extends FormBase implements OnInit {
  private readonly bancaService = inject(BancaService);

  banca = signal<Banca | null>(null);

  title = computed<string>(() => {
    const modes = [
      { active: this.isViewMode(), label: 'Visualizar Banca' },
      { active: this.isEditMode(), label: 'Editar Banca' },
      { active: this.isCreateMode(), label: 'Cadastrar Banca' },
    ];

    return modes.find((mode) => mode.active)?.label ?? 'Teste';
  });

  subtitle = computed<string>(() => {
    const modes = [
      { active: this.isViewMode(), label: 'Visualize os dados da Banca' },
      { active: this.isEditMode(), label: 'Edite os dados da Banca' },
      { active: this.isCreateMode(), label: 'Cadastre uma nova Banca' },
    ];

    return modes.find((mode) => mode.active)?.label ?? 'Teste';
  });

  errorNomeMessages: Record<string, string> = {
    required: 'O nome é obrigatório',
    minlength: 'O nome deve ter, no mínimo, 2 caracteres',
    maxlength: 'O nome deve ter, no máximo, 100 caracteres',
  };

  errorDescricaoMessages: Record<string, string> = {
    minlength: 'A descrição deve ter, no mínimo, 5 caracteres',
    maxlength: 'A descrição deve ter, no máximo, 500 caracteres',
  };

  async ngOnInit(): Promise<void> {
    this.createForm();
    if (!this.isCreateMode()) {
      await this.getBancaAndHandle();
    }
  }

  createForm() {
    this.form = this.fb.group({
      nome: [
        {
          value: '',
          disabled: this.isViewMode(),
        },
        [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
      ],

      descricao: [
        {
          value: '',
          disabled: this.isViewMode(),
        },
        [Validators.minLength(5), Validators.maxLength(500)],
      ],
    });
  }

  async getBancaAndHandle(): Promise<void> {
    this.banca.set(await this.bancaService.buscarPorId(this.pageId()));
    this.patchValueOnForm();
  }

  patchValueOnForm() {
    this.form.patchValue({
      nome: this.banca()?.nome,
      descricao: this.banca()?.descricao,
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

  async onCreate(): Promise<void> {
    const rawValue = this.form.getRawValue();
    const dto: CreateBancaDto = {
      nome: rawValue.nome,
      descricao: rawValue.descricao,
    };

    try {
      await this.bancaService.criar(dto);
      this.submitting.set(false);
      this.messageService.showSuccess(
        'Banca criada com sucesso. Você será redirecionado para listagem.',
      );
      this.router.navigate(['banca']);
      return;
    } catch (e: any) {
      console.error(e);
      const mensagem = e?.message ?? 'Erro ao criar banca. Tente novamente';
      this.messageService.showError(mensagem);
      this.submitting.set(false);
      return;
    }
  }

  async onUpdate(): Promise<void> {
    const rawValue = this.form.getRawValue();
    const dto: UpdateBancaDto = {
      id: this.banca()?.id ?? '',
      nome: rawValue.nome,
      descricao: rawValue.descricao,
    };

    try {
      await this.bancaService.atualizar(dto);
      this.submitting.set(false);
      this.messageService.showSuccess(
        'Banca atualizada com sucesso. Você será redirecionado para listagem.',
      );
      this.router.navigate(['banca']);
      return;
    } catch (e: any) {
      console.error(e);
      const mensagem = e?.message ?? 'Erro ao atualizar banca. Tente novamente';
      this.messageService.showError(mensagem);
      this.submitting.set(false);
      return;
    }
  }

  onVoltar() {
    this.router.navigate(['/banca']);
  }
}
