//Angular
import { computed, Directive, inject, signal } from '@angular/core';

//Aplicação
import { ListBase } from '../list-base/list-base';
import { ActivatedRoute } from '@angular/router';

@Directive({})
export class FormBase extends ListBase {
  protected readonly route = inject(ActivatedRoute);

  isEditMode = signal(this.router.url.includes('edicao'));
  isCreateMode = signal(this.router.url.includes('cadastro'));
  isViewMode = signal(this.router.url.includes('visualizacao'));

  pageId = computed<string>(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ?? '';
  });

  isInvalid(controlName: string): boolean {
    const control = this.form?.get(controlName);
    return (control?.touched && control?.dirty && control?.invalid) ?? false;
  }
}
