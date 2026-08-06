//Angular
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, model, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

//Aplicação
import { Banca } from '../../../pages/bancas/core/models/banca.model';
import { BancaService } from '../../../pages/bancas/core/services/banca.service';
import { Util } from '../../util/util';
import { FormLabel } from '../form-label/form-label';

//Externo
import { AutoComplete, AutoCompleteModule } from 'primeng/autocomplete';

@Component({
  selector: 'app-autocomplete-banca',
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
  templateUrl: './autocomplete-banca.html',
})
export class AutocompleteBanca implements OnInit {
  private readonly bancaService = inject(BancaService);

  form = input<FormGroup>();
  controlName = input<string>('');
  errorMessages = input<Record<string, string>>({});

  bancaSelecionada = model<Banca | null>(null);

  idField = input.required<string>();
  placeholder = input.required<string>();

  protected searchTermBanca = signal<string>('');

  protected bancas = signal<Banca[]>([]);

  protected bancasFiltradas = computed(() => {
    const busca = this.searchTermBanca().toLowerCase().trim();
    const listaOriginal = this.bancas();

    if (!busca) {
      return listaOriginal;
    }

    return listaOriginal.filter((banca) => banca.nome.toLowerCase().includes(busca));
  });

  ngOnInit(): void {
    if ((this.form() && this.controlName()) || this.bancaSelecionada() !== undefined) {
      this.consultarBancas();
      return;
    }
    throw new Error(
      'O componente AutocompleteBanca requer que seja passado o form e o controlName ou o ngModel',
    );
  }

  async consultarBancas(): Promise<void> {
    this.bancas.set(await this.bancaService.listar());
  }

  searchBanca(event: any) {
    this.searchTermBanca.set(event?.query);
  }

  isInvalid(): boolean {
    const control = this.form()?.get(this.controlName() ?? '');
    return (control?.touched && control?.dirty && control?.invalid) ?? false;
  }

  abrirAutocomplete(ac: AutoComplete) {
    this.searchBanca({ query: '' } as any);
    Util.forcarAberturaAutocompleteMultiselect(ac);
  }

  fecharAutocomplete(ac: AutoComplete) {
    this.searchBanca({ query: '' });
    Util.forcarFechamentoAutocompleteMultiselect(ac);
  }

  controlForm(): FormControl {
    if (this.form() && this.controlName()) {
      return this.form()?.get(this.controlName()) as FormControl;
    }
    throw new Error(
      'O componente AutocompleteBanca requer que seja passado o form e o controlName',
    );
  }
}
