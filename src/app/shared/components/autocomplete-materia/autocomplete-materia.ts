//Angular
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, model, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

//Aplicação
import { Materia } from '../../../pages/materias/core/models/materia.model';
import { MateriaService } from '../../../pages/materias/core/services/materia.service';
import { MateriasFormPage } from '../../../pages/materias/components/materias-form-page/materias-form-page';
import { FormDialogData } from '../form-base/form-base';
import { Util } from '../../util/util';
import { LayoutService } from '../../../core/services/layout.service';
import { FormLabel } from '../form-label/form-label';

//Externo
import { AutoComplete, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';

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
    ButtonModule,
  ],
  templateUrl: './autocomplete-materia.html',
})
export class AutocompleteMateria implements OnInit {
  private readonly materiaService = inject(MateriaService);
  private readonly dialogService = inject(DialogService);
  private readonly layoutService = inject(LayoutService);

  form = input<FormGroup>();
  controlName = input<string>('');
  errorMessages = input<Record<string, string>>({});

  materiaSelecionada = model<Materia | null>(null);

  idField = input.required<string>();
  placeholder = input.required<string>();
  exibirBotaoCadastro = input<boolean>(false);

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

  async consultarMaterias(): Promise<void> {
    this.materias.set(await this.materiaService.listar());
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
    Util.forcarAberturaAutocompleteMultiselect(ac);
  }

  fecharAutocomplete(ac: AutoComplete) {
    this.searchMateria({ query: '' });
    Util.forcarFechamentoAutocompleteMultiselect(ac);
  }

  abrirModalCriacaoMateria(ac: AutoComplete): void {
    Util.forcarFechamentoAutocompleteMultiselect(ac);

    const ref = this.dialogService.open(MateriasFormPage, {
      header: 'Nova Matéria',
      width: this.layoutService.isMobile() ? '100vw' : '40vw',
      closeOnEscape: true,
      draggable: false,
      closable: true,
      maximizable: this.layoutService.isMobile(),
      contentStyle: { overflow: 'auto' },
      data: { mode: 'cadastro' } satisfies FormDialogData,
    });

    ref?.onClose.subscribe((materiaCriada?: Materia) => {
      if (!materiaCriada) {
        return;
      }
      this.consultarMaterias().then(() => this.selecionarMateriaCriada(materiaCriada));
    });
  }

  private selecionarMateriaCriada(materia: Materia): void {
    if (this.form() && this.controlName()) {
      this.controlForm().setValue(materia);
      return;
    }
    this.materiaSelecionada.set(materia);
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
