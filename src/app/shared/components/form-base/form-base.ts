//Angular
import { Directive, signal } from '@angular/core';

//Aplicação
import { ListBase } from '../list-base/list-base';

@Directive({})
export class FormBase extends ListBase {
  isViewMode = signal(this.router.url.includes('visualizacao'));
  isEditMode = signal(this.router.url.includes('edicao'));
  isCreateMode = signal(this.router.url.includes('cadastro'));

  isInvalid(controlName: string): boolean {
    const control = this.form?.get(controlName);
    return (control?.touched && control?.dirty && control?.invalid) ?? false;
  }
}
