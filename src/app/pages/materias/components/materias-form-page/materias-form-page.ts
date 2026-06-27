//Angular
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

//Externos
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';

//Aplicação
import { MateriaService } from '../../core/services/materia.service';
import { Loading } from '../../../../shared/components/loading/loading';
import { FormBase } from '../../../../shared/components/form-base/form-base';
import { FormLabel } from '../../../../shared/components/form-label/form-label';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';
import { CreateMateriaDto } from '../../core/models/create-materia.dto';

@Component({
  selector: 'app-materias-form-page',
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
  templateUrl: './materias-form-page.html',
})
export class MateriasFormPage extends FormBase implements OnInit {
  private readonly materiaService = inject(MateriaService);

  title = computed<string>(() => {
    const modes = [
      { active: this.isViewMode(), label: 'Visualizar Matéria' },
      { active: this.isEditMode(), label: 'Editar Matéria' },
      { active: this.isCreateMode(), label: 'Cadastrar Matéria' },
    ];

    return modes.find((mode) => mode.active)?.label ?? 'Teste';
  });

  subtitle = computed<string>(() => {
    const modes = [
      { active: this.isViewMode(), label: 'Visualize os dados da Matéria' },
      { active: this.isEditMode(), label: 'Edite os dados da Matéria' },
      { active: this.isCreateMode(), label: 'Cadastre uma nova Matéria' },
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

  ngOnInit(): void {
    this.createForm();
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
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.submitting.set(true);
      const rawValue = this.form.getRawValue();
      const dto: CreateMateriaDto = {
        nome: rawValue.nome,
        descricao: rawValue.descricao,
      };

      this.materiaService.criar(dto);
      this.submitting.set(false);
      this.messageService.showSuccess(
        'Matéria criada com sucesso. Você será redirecionado para listagem.',
      );

      this.router.navigate(['materia']);

      return;
    }
    this.form.markAllAsDirty();
    this.form.markAllAsTouched();
    this.messageService.showInfo('Formulário inválido. Preencha o formulário corretamente.');
  }

  onVoltar() {
    this.router.navigate(['/materia']);
  }
}
