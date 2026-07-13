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
import { EditorModule } from 'primeng/editor';
import { InputTextModule } from 'primeng/inputtext';
import { map, of, startWith, switchMap } from 'rxjs';
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
    EditorModule,
    InputTextModule,
    RadioButtonModule,
  ],
  templateUrl: './alternativa.html',
  styleUrls: ['./alternativa.scss'],
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
      return 'style-correta-dark';
    }
    return 'style-correta-light';
  });

  readonly alternativaDisabled = computed(() => {
    return this.isTextoDisabledSignal();
  });

  private readonly isTextoDisabledSignal = toSignal(
    toObservable(this.formGroup).pipe(
      switchMap((form) => {
        const control = form.get('texto');
        if (!control) return of(true);

        return control.statusChanges.pipe(
          startWith(control.status),
          map(() => control.disabled),
        );
      }),
    ),
    { initialValue: false },
  );

  handleOnTextChange() {
    if (!this.alternativaDisabled) {
      return;
    }
    this.formGroup().get('texto')?.setValue(null);
  }
}
