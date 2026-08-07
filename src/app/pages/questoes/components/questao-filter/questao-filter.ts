//Angular
import { Component, input, output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

//Aplicação
import { OPCOES_SIM_NAO } from '../../../../shared/enums/sim-nao.enum';
import { OPCOES_TIPO_QUESTAO } from '../../core/enums/tipo-questao.enum';
import { FormLabel } from '../../../../shared/components/form-label/form-label';
import { OPCOES_NIVEL_DIFICULDADE } from '../../core/enums/nivel-dificuldade.enum';
import { MultiselectAssunto } from '../../../../shared/components/multiselect-assunto/multiselect-assunto';
import { AutocompleteBanca } from '../../../../shared/components/autocomplete-banca/autocomplete-banca';
import { AutocompleteMateria } from '../../../../shared/components/autocomplete-materia/autocomplete-materia';

//Externo
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-questao-filter',
  imports: [
    //Angular
    FormsModule,
    ReactiveFormsModule,

    //Aplicação
    FormLabel,
    MultiselectAssunto,
    AutocompleteBanca,
    AutocompleteMateria,

    //Externo
    SelectModule,
    ButtonModule,
    InputIconModule,
    IconFieldModule,
    InputTextModule,
  ],
  templateUrl: './questao-filter.html',
})
export class QuestaoFilter {
  form = input.required<FormGroup>();
  showResolverAction = input<boolean>(false);

  resolverActionClick = output();

  readonly tiposQuestao = OPCOES_TIPO_QUESTAO;
  readonly dificuldades = OPCOES_NIVEL_DIFICULDADE;
  readonly simNao = OPCOES_SIM_NAO;

  onLimpar() {
    this.form().reset();
    this.form().updateValueAndValidity();
  }
}
