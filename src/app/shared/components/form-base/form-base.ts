//Angular
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Directive, inject, signal } from '@angular/core';

@Directive({})
export class FormBase {
  protected readonly router = inject(Router);
  protected readonly fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({});

  isViewMode = signal(this.router.url.includes('visualizacao'));
  isEditMode = signal(this.router.url.includes('edicao'));
  isCreateMode = signal(this.router.url.includes('cadastro'));


}
