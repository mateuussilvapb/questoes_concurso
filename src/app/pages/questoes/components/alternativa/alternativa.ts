//Angular
import { CommonModule } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Component, computed, effect, inject, input, output } from '@angular/core';

//Aplicação
import { Util } from '../../../../shared/util/util';
import { ThemeService } from '../../../../core/services/theme.service';

// Externo
import { ButtonModule } from 'primeng/button';
import { of, startWith, switchMap } from 'rxjs';
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
  private readonly themeService = inject(ThemeService);

  index = input.required<number>();
  formGroup = input.required<FormGroup>();
  qtdAlternativas = input.required<number>();
  tipoQuestaoMultiplaEscolha = input.required<boolean>();

  removeAlternativa = output<number>();
  selectAlternativa = output<number>();

  constructor() {
    effect(() => {
      const isMultiplaEscolha = this.tipoQuestaoMultiplaEscolha();
      this.handleChangeTipoQuestao(isMultiplaEscolha);
    });
  }

  handleChangeTipoQuestao(isMultiplaEscolha: boolean) {
    if (isMultiplaEscolha) {
      this.formGroup().get('texto')?.enable();
      return;
    }
    this.formGroup().get('texto')?.disable();
  }

  mapIndexToLetter(index: number): string {
    return Util.mapIndexToLetter(index);
  }

  onSelectAlternativa(event: RadioButtonClickEvent) {
    event.originalEvent.preventDefault();
    event.originalEvent.stopPropagation();
    this.selectAlternativa.emit(this.index());
  }

  private readonly isCorretaSignal = toSignal(
    toObservable(this.formGroup).pipe(
      switchMap((form) => {
        const control = form.get('correta');
        if (!control) return of(false);

        return control.valueChanges.pipe(startWith(control.value));
      }),
    ),
    { initialValue: false },
  );

  backgroundColorAlternativaCorreta = computed(() => {
    const isCorreta = this.isCorretaSignal();
    if (!isCorreta) return '';

    const isDarkMode = this.themeService.isDarkMode();
    if (isDarkMode) {
      return 'bg-green-700 text-0 font-bold';
    }
    return 'bg-green-50 font-bold';
  });
}
