//Angular
import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, signal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';

//Externos
import { TooltipModule } from 'primeng/tooltip';
import { merge } from 'rxjs';

@Component({
  selector: 'app-form-label',
  standalone: true,
  imports: [
    //Angular
    CommonModule,
    ReactiveFormsModule,

    //Externos
    TooltipModule,
  ],
  templateUrl: './form-label.html',
  styleUrl: './form-label.scss',
  host: {
    '(focusout)': 'onBlur()',
  },
})
export class FormLabel {
  readonly for = input.required<string>();
  readonly label = input.required<string>();
  readonly control = input.required<AbstractControl>();

  readonly icon = input<string>();
  readonly customClass = input('');
  readonly tooltipMessage = input<string>();

  readonly errorMessages = input<Record<string, string>>({
    required: 'Este campo é obrigatório.',
    email: 'E-mail inválido.',
  });

  /**
   * Estado reativo do controle.
   */
  private readonly state = signal({
    touched: false,
    dirty: false,
    pristine: true,
    errors: null as Record<string, any> | null,
  });

  constructor() {
    effect((onCleanup) => {
      const ctrl = this.control();

      if (!ctrl) {
        this.state.set({
          touched: false,
          dirty: false,
          pristine: true,
          errors: null,
        });
        return;
      }

      const updateState = () => {
        this.state.set({
          touched: ctrl.touched,
          dirty: ctrl.dirty,
          pristine: ctrl.pristine,
          errors: ctrl.errors,
        });
      };

      updateState();

      const subscription = merge(ctrl.valueChanges, ctrl.statusChanges).subscribe(updateState);

      onCleanup(() => subscription.unsubscribe());
    });
  }

  onBlur(): void {
    const ctrl = this.control();

    if (!ctrl) {
      return;
    }

    ctrl.markAsTouched();
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity();

    this.state.set({
      touched: ctrl.touched,
      dirty: ctrl.dirty,
      pristine: ctrl.pristine,
      errors: ctrl.errors,
    });
  }

  readonly errorMessage = computed(() => {
    const state = this.state();

    if (!state.errors) {
      return '';
    }

    if (state.pristine && !state.touched) {
      return '';
    }

    const firstError = Object.keys(state.errors)[0];

    return this.errorMessages()?.[firstError] ?? `Erro: ${firstError}`;
  });
}
