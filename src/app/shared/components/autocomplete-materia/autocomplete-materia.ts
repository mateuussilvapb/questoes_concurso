//Angular
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';

//Aplicação
import { Util } from '../../util/util';
import { FormLabel } from '../form-label/form-label';
import { Materia } from '../../../pages/materias/core/models/materia.model';
import { MateriaService } from '../../../pages/materias/core/services/materia.service';

//Externo
import { AutoComplete, AutoCompleteModule } from 'primeng/autocomplete';

@Component({
  selector: 'app-autocomplete-materia',
  imports: [
    //Angular
    FormsModule,
    ReactiveFormsModule,

    //Aplicação
    FormLabel,

    //Externo
    AutoCompleteModule,
  ],
  templateUrl: './autocomplete-materia.html',
})
export class AutocompleteMateria implements OnInit {
  private readonly materiaService = inject(MateriaService);

  form = input.required<FormGroup>();
  idField = input.required<string>();
  controlName = input.required<string>();
  placeholder = input.required<string>();
  errorMessages = input.required<Record<string, string>>();

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
    this.consultarMaterias();
  }

  consultarMaterias() {
    this.materias.set(this.materiaService.listar());
  }

  searchMateria(event: any) {
    this.searchTermMateria.set(event?.query);
  }

  isInvalid(): boolean {
    const control = this.form().get(this.controlName());
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
}
