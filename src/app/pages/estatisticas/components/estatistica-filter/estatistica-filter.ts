//Angular
import { Component, input, output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

//Aplicação
import { FormLabel } from '../../../../shared/components/form-label/form-label';
import { AutocompleteMateria } from '../../../../shared/components/autocomplete-materia/autocomplete-materia';
import { MultiselectAssunto } from '../../../../shared/components/multiselect-assunto/multiselect-assunto';
import { OPCOES_NIVEL_DIFICULDADE } from '../../../questoes/core/enums/nivel-dificuldade.enum';

//Externo
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectButtonModule } from 'primeng/selectbutton';

interface OpcaoPeriodoRapido {
  label: string;
  dias: number | null;
}

const OPCOES_PERIODO_RAPIDO: OpcaoPeriodoRapido[] = [
  { label: '7 dias', dias: 7 },
  { label: '30 dias', dias: 30 },
  { label: '90 dias', dias: 90 },
  { label: 'Tudo', dias: null },
];

@Component({
  selector: 'app-estatistica-filter',
  imports: [
    //Angular
    FormsModule,
    ReactiveFormsModule,

    //Aplicação
    FormLabel,
    AutocompleteMateria,
    MultiselectAssunto,

    //Externo
    SelectModule,
    ButtonModule,
    DatePickerModule,
    SelectButtonModule,
  ],
  templateUrl: './estatistica-filter.html',
})
export class EstatisticaFilter {
  form = input.required<FormGroup>();

  atualizar = output();

  readonly dificuldades = OPCOES_NIVEL_DIFICULDADE;
  readonly periodosRapidos = OPCOES_PERIODO_RAPIDO;

  onSelecionarPeriodo(dias: number | null): void {
    if (dias === null) {
      this.form().patchValue({ dataInicioPeriodoConsulta: null, dataFimPeriodoConsulta: null });
      return;
    }

    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - (dias - 1));
    inicio.setHours(0, 0, 0, 0);

    this.form().patchValue({ dataInicioPeriodoConsulta: inicio, dataFimPeriodoConsulta: fim });
  }

  onLimpar(): void {
    this.form().reset();
    this.form().updateValueAndValidity();
  }

  onAtualizar(): void {
    this.atualizar.emit();
  }
}
