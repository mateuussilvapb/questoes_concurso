//Angular
import { Component, computed, inject, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';

//Externos
import { CardModule } from 'primeng/card';

//Aplicação
import { MateriaService } from '../../core/services/materia.service';
import { FormBase } from '../../../../shared/components/form-base/form-base';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';

@Component({
  selector: 'app-materias-form-page',
  imports: [
    //Aplicação
    LayoutBasePages,

    //Externos
    CardModule
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

  ngOnInit(): void {
    this.createForm();
  }

  createForm() {
    this.form = this.fb.group({
      nome: {
        value: '',
        disabled: this.isViewMode(),
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
      },
      descricao: {
        value: '',
        disabled: this.isViewMode(),
        validators: [Validators.minLength(2), Validators.maxLength(500)],
      },
    });
  }

  submit(){}
}
