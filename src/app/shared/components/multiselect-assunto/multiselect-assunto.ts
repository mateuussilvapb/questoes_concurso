//Angular
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, model, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

//Aplicação
import { Assunto } from '../../../pages/assuntos/core/models/assunto.model';
import { AssuntoService } from '../../../pages/assuntos/core/services/assunto.service';
import { Util } from '../../util/util';
import { FormLabel } from '../form-label/form-label';

//Externo
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-multiselect-assunto',
  imports: [
    //Angular
    FormsModule,
    CommonModule,
    ReactiveFormsModule,

    //Aplicação
    FormLabel,

    //Externos
    MultiSelectModule,
  ],
  templateUrl: './multiselect-assunto.html',
})
export class MultiselectAssunto implements OnInit {
  private readonly assuntoService = inject(AssuntoService);

  form = input<FormGroup>();
  controlName = input<string>('');
  errorMessages = input<Record<string, string>>({});

  tooltipMessage = input<string>();
  assuntoSelecionado = model<Assunto | null>(null);

  idField = input.required<string>();
  placeholder = input.required<string>();

  searchTermIdMateria = input<string | null>(null);
  protected searchTermAssunto = signal<string>('');

  protected assuntos = signal<Assunto[]>([]);

  protected assuntosFiltrados = computed(() => {
    const busca = this.searchTermAssunto()?.toLowerCase()?.trim() ?? null;
    const materiaId = this.searchTermIdMateria() ?? null;
    const listaOriginal = this.assuntos();

    if (!busca && materiaId) {
      return listaOriginal.filter((assunto) => assunto.idMateria == materiaId);
    }

    if (busca && !materiaId) {
      return listaOriginal.filter((assunto) => assunto.nome.toLowerCase().includes(busca));
    }

    if (busca && materiaId) {
      return listaOriginal.filter(
        (assunto) => assunto.nome.toLowerCase().includes(busca) && assunto.idMateria == materiaId,
      );
    }

    return listaOriginal;
  });

  ngOnInit(): void {
    if ((this.form() && this.controlName()) || this.assuntoSelecionado() !== undefined) {
      this.consultarAssuntos();
      return;
    }
    throw new Error(
      'O componente AutocompleteAssunto requer que seja passado o form e o controlName ou o ngModel',
    );
  }

  consultarAssuntos() {
    this.assuntos.set(this.assuntoService.listar());
  }

  searchAssunto(event: any) {
    this.searchTermAssunto.set(event?.query);
  }

  isInvalid(): boolean {
    const control = this.form()?.get(this.controlName() ?? '');
    return (control?.touched && control?.dirty && control?.invalid) ?? false;
  }

  abrirMultiselect(ac: MultiSelect) {
    this.searchAssunto({ query: '' } as any);
    Util.forcarAberturaAutocompleteMultiselect(ac);
  }

  fecharMultiselect(ac: MultiSelect) {
    this.searchAssunto({ query: '' });
    Util.forcarFechamentoAutocompleteMultiselect(ac);
  }

  controlForm(): FormControl {
    if (this.form() && this.controlName()) {
      return this.form()?.get(this.controlName()) as FormControl;
    }
    throw new Error(
      'O componente AutocompleteAssunto requer que seja passado o form e o controlName',
    );
  }
}
