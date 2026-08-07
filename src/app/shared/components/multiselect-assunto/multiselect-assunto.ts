//Angular
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, model, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

//Aplicação
import { Assunto } from '../../../pages/assuntos/core/models/assunto.model';
import { AssuntoService } from '../../../pages/assuntos/core/services/assunto.service';
import { AssuntosFormPage } from '../../../pages/assuntos/components/assuntos-form-page/assuntos-form-page';
import { Materia } from '../../../pages/materias/core/models/materia.model';
import { FormDialogData } from '../form-base/form-base';
import { Util } from '../../util/util';
import { LayoutService } from '../../../core/services/layout.service';
import { FormLabel } from '../form-label/form-label';

//Externo
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';

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
    ButtonModule,
  ],
  templateUrl: './multiselect-assunto.html',
})
export class MultiselectAssunto implements OnInit {
  private readonly assuntoService = inject(AssuntoService);
  private readonly dialogService = inject(DialogService);
  private readonly layoutService = inject(LayoutService);

  form = input<FormGroup>();
  controlName = input<string>('');
  errorMessages = input<Record<string, string>>({});

  tooltipMessage = input<string>();
  assuntoSelecionado = model<Assunto | null>(null);

  idField = input.required<string>();
  placeholder = input.required<string>();
  exibirBotaoCadastro = input<boolean>(false);
  materiaParaNovoAssunto = input<Materia | null>(null);

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

  async ngOnInit(): Promise<void> {
    if ((this.form() && this.controlName()) || this.assuntoSelecionado() !== undefined) {
      await this.consultarAssuntos();
      return;
    }
    throw new Error(
      'O componente AutocompleteAssunto requer que seja passado o form e o controlName ou o ngModel',
    );
  }

  async consultarAssuntos() {
    this.assuntos.set(await this.assuntoService.listar());
  }

  searchAssunto(event: any) {
    this.searchTermAssunto.set(event?.query);
  }

  isInvalid(): boolean {
    const control = this.form()?.get(this.controlName() ?? '');
    return (control?.touched && control?.dirty && control?.invalid) ?? false;
  }

  /**
   * Enquanto true, bloqueia reaberturas do painel do multiselect. Necessário porque o
   * MultiSelect do PrimeNG refoca o input interno em `onContainerClick` mesmo quando o clique
   * ocorreu em conteúdo do próprio overlay (ex: botão "Novo Assunto"), o que dispara (onFocus)
   * novamente e reabre o painel por cima do modal de cadastro que acabou de ser aberto.
   */
  private bloquearReaberturaMultiselect = false;

  abrirMultiselect(ac: MultiSelect) {
    if (this.bloquearReaberturaMultiselect) {
      return;
    }
    this.searchAssunto({ query: '' } as any);
    Util.forcarAberturaAutocompleteMultiselect(ac);
  }

  fecharMultiselect(ac: MultiSelect) {
    this.searchAssunto({ query: '' });
    Util.forcarFechamentoAutocompleteMultiselect(ac);
  }

  abrirModalCriacaoAssunto(ac: MultiSelect): void {
    this.bloquearReaberturaMultiselect = true;
    Util.forcarFechamentoAutocompleteMultiselect(ac);

    const materia = this.materiaParaNovoAssunto();

    const ref = this.dialogService.open(AssuntosFormPage, {
      header: 'Novo Assunto',
      width: this.layoutService.isMobile() ? '100vw' : '40vw',
      closeOnEscape: true,
      draggable: false,
      closable: true,
      maximizable: this.layoutService.isMobile(),
      contentStyle: { overflow: 'auto' },
      data: {
        mode: 'cadastro',
        valoresIniciais: materia ? { materia } : undefined,
      } satisfies FormDialogData,
    });

    ref?.onClose.subscribe((assuntoCriado?: Assunto) => {
      this.bloquearReaberturaMultiselect = false;

      if (!assuntoCriado) {
        return;
      }
      this.consultarAssuntos().then(() => this.selecionarAssuntoCriado(assuntoCriado));
    });
  }

  private selecionarAssuntoCriado(assunto: Assunto): void {
    if (this.form() && this.controlName()) {
      const atuais: Assunto[] = this.controlForm().value ?? [];
      this.controlForm().setValue([...atuais, assunto]);
      return;
    }
    this.assuntoSelecionado.set(assunto);
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
