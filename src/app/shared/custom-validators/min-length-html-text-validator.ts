import { Util } from './../util/util';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function minLengthHtmlTextValidator(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const text = Util.htmlToText(control.value);

    if (text.length === 0) {
      return null;
    }

    if (text.length < min) {
      return {
        minlength: true,
      };
    }

    return null;
  };
}
