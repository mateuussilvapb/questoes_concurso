//Angular
import { Component, inject, signal } from '@angular/core';

//Externo
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-dialog-comentario',
  imports: [],
  template: `<div class="ml-3" [innerHTML]="comentario()"></div> `,
})
export class DialogComentario {
  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly dialogService = inject(DialogService);

  readonly comentario = signal<string>('');

  constructor() {
    this.setComentario();
  }

  private setComentario() {
    const dataRef = this.dialogService.getInstance(this.dialogRef)?.data;
    this.comentario.set(dataRef?.comentario ?? '');
  }
}
