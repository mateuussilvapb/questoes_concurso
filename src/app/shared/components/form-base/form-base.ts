//Angular
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Directive, inject, signal } from '@angular/core';

//Aplicação
import { MessageService } from '../../services/message.service';

@Directive({})
export class FormBase {
  protected readonly router = inject(Router);
  protected readonly fb = inject(FormBuilder);
  protected readonly messageService = inject(MessageService);

  form: FormGroup = this.fb.group({});

  isViewMode = signal(this.router.url.includes('visualizacao'));
  isEditMode = signal(this.router.url.includes('edicao'));
  isCreateMode = signal(this.router.url.includes('cadastro'));

  submitting = signal<boolean>(false);

  isInvalid(controlName: string): boolean {
    const control = this.form?.get(controlName);
    return (control?.touched && control?.dirty && control?.invalid) ?? false;
  }
}
