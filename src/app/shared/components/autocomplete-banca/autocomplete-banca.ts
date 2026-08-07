//Angular
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, model, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

//Aplicação
import { Banca } from '../../../pages/bancas/core/models/banca.model';
import { BancaService } from '../../../pages/bancas/core/services/banca.service';
import { BancasFormPage } from '../../../pages/bancas/components/bancas-form-page/bancas-form-page';
import { FormDialogData } from '../form-base/form-base';
import { Util } from '../../util/util';
import { LayoutService } from '../../../core/services/layout.service';
import { FormLabel } from '../form-label/form-label';

//Externo
import { AutoComplete, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';

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
    ButtonModule,
  ],
  templateUrl: './autocomplete-banca.html',
})
export class AutocompleteBanca implements OnInit {
  private readonly bancaService = inject(BancaService);
  private readonly dialogService = inject(DialogService);
  private readonly layoutService = inject(LayoutService);

  form = input<FormGroup>();
  controlName = input<string>('');
  errorMessages = input<Record<string, string>>({});

  bancaSelecionada = model<Banca | null>(null);

  idField = input.required<string>();
  placeholder = input.required<string>();
  exibirBotaoCadastro = input<boolean>(false);

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

  abrirModalCriacaoBanca(ac: AutoComplete): void {
    Util.forcarFechamentoAutocompleteMultiselect(ac);

    const ref = this.dialogService.open(BancasFormPage, {
      header: 'Nova Banca',
      width: this.layoutService.isMobile() ? '100vw' : '40vw',
      closeOnEscape: true,
      draggable: false,
      closable: true,
      maximizable: this.layoutService.isMobile(),
      contentStyle: { overflow: 'auto' },
      data: { mode: 'cadastro' } satisfies FormDialogData,
    });

    ref?.onClose.subscribe((bancaCriada?: Banca) => {
      if (!bancaCriada) {
        return;
      }
      this.consultarBancas().then(() => this.selecionarBancaCriada(bancaCriada));
    });
  }

  private selecionarBancaCriada(banca: Banca): void {
    if (this.form() && this.controlName()) {
      this.controlForm().setValue(banca);
      return;
    }
    this.bancaSelecionada.set(banca);
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
