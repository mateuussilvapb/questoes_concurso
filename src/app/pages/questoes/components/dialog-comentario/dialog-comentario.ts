//Angular
import { DomSanitizer } from '@angular/platform-browser';
import { Component, computed, inject, signal } from '@angular/core';

//Aplicação
import { Util } from '../../../../shared/util/util';

//Externo
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-dialog-comentario',
  imports: [],
  template: `<div class="editor-content" [innerHTML]="comentarioBypassSanitizer()"></div> `,
})
export class DialogComentario {
  private readonly sanitizer = inject(DomSanitizer);
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

  comentarioBypassSanitizer = computed(() =>
    Util.bypassSanitizerHtml(this.comentario(), this.sanitizer),
  );
}
