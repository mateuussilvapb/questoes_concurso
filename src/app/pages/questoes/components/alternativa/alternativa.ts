// alternativa.ts
import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

// Externo
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonClickEvent, RadioButtonModule } from 'primeng/radiobutton';

@Component({
  selector: 'app-alternativa',
  imports: [
    //Anguar
    FormsModule,
    CommonModule,
    ReactiveFormsModule,

    // Externo
    ButtonModule,
    InputTextModule,
    RadioButtonModule,
  ],
  templateUrl: './alternativa.html',
})
export class Alternativa {
  index = input.required<number>();
  formGroup = input.required<FormGroup>();
  qtdAlternativas = input.required<number>();
  tipoQuestaoMultiplaEscolha = input.required<boolean>();

  removeAlternativa = output<number>();
  selectAlternativa = output<number>();

  mapIndexToLetter(index: number): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[index] || '';
  }

  onSelectAlternativa(event: RadioButtonClickEvent) {
    event.originalEvent.preventDefault();
    event.originalEvent.stopPropagation();
    this.selectAlternativa.emit(this.index());
  }
}
