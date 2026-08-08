//Angular
import { Component, inject } from '@angular/core';

//Externo
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

export type EncerrarResolucaoOpcao = 'persistir' | 'continuar' | 'descartar';

@Component({
  selector: 'app-dialog-encerrar-resolucao',
  imports: [ButtonModule],
  templateUrl: './dialog-encerrar-resolucao.html',
})
export class DialogEncerrarResolucao {
  private readonly dialogRef = inject(DynamicDialogRef);

  escolher(opcao: EncerrarResolucaoOpcao) {
    this.dialogRef.close(opcao);
  }
}
