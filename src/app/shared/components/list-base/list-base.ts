//Angular
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Directive, inject, signal } from '@angular/core';

//Aplicação
import { MessageService } from '../../services/message.service';

//Externo
import { ConfirmationService } from 'primeng/api';

@Directive({})
export class ListBase {
  protected readonly router = inject(Router);
  protected readonly fb = inject(FormBuilder);
  protected readonly messageService = inject(MessageService);
  protected readonly confirmationService = inject(ConfirmationService);

  form: FormGroup = this.fb.group({});

  submitting = signal<boolean>(false);

  getContentFieldOrDefault(data: any): string {
    if (data) {
      if (typeof data == 'string') {
        if (data != '') return data;
        return '-';
      }
      return data;
    }
    return '-';
  }
}
