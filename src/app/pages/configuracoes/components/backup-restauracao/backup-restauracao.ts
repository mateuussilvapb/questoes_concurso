//Angular
import { Component, inject } from '@angular/core';

//Aplicação
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';

//Externo
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ImportMode } from '../../../../core/storage/backup.models';
import { BackupService } from '../../core/services/backup.service';
import { MessageService } from '../../../../shared/services/message.service';

@Component({
  selector: 'app-backup-restauracao',
  imports: [
    //Aplicação
    LayoutBasePages,

    //Externo
    CardModule,
    ButtonModule,
  ],
  templateUrl: './backup-restauracao.html',
})
export class BackupRestauracao {
  private readonly backupService = inject(BackupService);
  private readonly messageService = inject(MessageService);

  backup(): void {
    this.backupService.export();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!file) {
      return;
    }

    try {
      const result = await this.backupService.import(file, ImportMode.MERGE);
      this.messageService.showSuccess('Arquivo importado com sucesso!', 'Sucesso!');
      console.log(result);
    } catch (error) {
      console.error(error);
      this.messageService.showError('Erro ao importar arquivo. Tente novamente', 'Erro!');
    } finally {
      // Permite selecionar o mesmo arquivo novamente
      input.value = '';
    }
  }
}
