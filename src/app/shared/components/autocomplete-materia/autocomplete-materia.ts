import { Component, computed, inject, input, model, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AutoComplete, AutoCompleteModule } from 'primeng/autocomplete';
import { Util } from '../../util/util';
import { Materia } from '../../../pages/materias/core/models/materia.model';
import { MateriaService } from '../../../pages/materias/core/services/materia.service';
import { FormLabel } from '../form-label/form-label';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-autocomplete-materia',
  imports: [
    //Angular
    FormsModule,
    CommonModule,
    ReactiveFormsModule,

    //Aplicação
    FormLabel,

    //Externos
    AutoCompleteModule,
  ],
  templateUrl: './autocomplete-materia.html',
})
export class AutocompleteMateria implements OnInit {
  private readonly materiaService = inject(MateriaService);

  form = input<FormGroup>();
  controlName = input<string>('');
  errorMessages = input<Record<string, string>>({});

  materiaSelecionada = model<Materia | null>(null);

  idField = input.required<string>();
  placeholder = input.required<string>();

  protected searchTermMateria = signal<string>('');

  protected materias = signal<Materia[]>([]);

  protected materiasFiltradas = computed(() => {
    const busca = this.searchTermMateria().toLowerCase().trim();
    const listaOriginal = this.materias();

    if (!busca) {
      return listaOriginal;
    }

    return listaOriginal.filter((materia) => materia.nome.toLowerCase().includes(busca));
  });

  ngOnInit(): void {
    if ((this.form() && this.controlName()) || this.materiaSelecionada() !== undefined) {
      this.consultarMaterias();
      return;
    }
    throw new Error(
      'O componente AutocompleteMateria requer que seja passado o form e o controlName ou o ngModel',
    );
  }

  consultarMaterias() {
    this.materias.set(this.materiaService.listar());
  }

  searchMateria(event: any) {
    this.searchTermMateria.set(event?.query);
  }

  isInvalid(): boolean {
    const control = this.form()?.get(this.controlName() ?? '');
    return (control?.touched && control?.dirty && control?.invalid) ?? false;
  }

  abrirAutocomplete(ac: AutoComplete) {
    this.searchMateria({ query: '' } as any);
    Util.forcarAberturaAutocomplete(ac);
  }

  fecharAutocomplete(ac: AutoComplete) {
    this.searchMateria({ query: '' });
    Util.forcarFechamentoAutocomplete(ac);
  }

  controlForm(): FormControl {
    if (this.form() && this.controlName()) {
      return this.form()?.get(this.controlName()) as FormControl;
    }
    throw new Error(
      'O componente AutocompleteMateria requer que seja passado o form e o controlName',
    );
  }
}
