//Angular
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

//Aplicação
import { FormLabel } from '../../../../shared/components/form-label/form-label';
import { minLengthHtmlTextValidator } from '../../../../shared/custom-validators/min-length-html-text-validator';

//Externo
import { ButtonModule } from 'primeng/button';
import { EditorModule } from 'primeng/editor';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-dialog-editar-comentario',
  imports: [
    //Angular
    FormsModule,
    CommonModule,
    ReactiveFormsModule,

    //Aplicação
    FormLabel,

    //Externo
    ButtonModule,
    EditorModule,
  ],
  templateUrl: './dialog-editar-comentario.html',
})
export class DialogEditarComentario {
  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly dialogService = inject(DialogService);

  readonly submitting = signal<boolean>(false);

  readonly errorComentarioMessages: Record<string, string> = {
    minlength: 'Os comentários devem ter, no mínimo, 5 caracteres',
  };

  readonly comentarioControl = new FormControl<string>('', [minLengthHtmlTextValidator(5)]);

  constructor() {
    this.setComentario();
  }

  private setComentario() {
    const dataRef = this.dialogService.getInstance(this.dialogRef)?.data;
    this.comentarioControl.setValue(dataRef?.comentario ?? '');
  }

  salvar() {
    if (this.comentarioControl.invalid) {
      this.comentarioControl.markAsDirty();
      this.comentarioControl.markAsTouched();
      this.comentarioControl.updateValueAndValidity();
      return;
    }

    this.dialogRef.close(this.comentarioControl.value ?? '');
  }

  cancelar() {
    this.dialogRef.close();
  }
}
