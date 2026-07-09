//Angular
import { Component, inject } from '@angular/core';

//Aplicação
import { BackupService } from '../../core/services/backup.service';
import { ImportMode } from '../../../../core/storage/backup.models';
import { StorageService } from './../../../../core/storage/storage.service';
import { MessageService } from '../../../../shared/services/message.service';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';

//Externo
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';

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
  private readonly storageService = inject(StorageService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  backup(): void {
    this.backupService.export();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!this.fileValid(file)) {
      this.messageService.showError(
        `Selecione um arquivo válido com extensão '.json'`,
        'Arquivo Inválido!',
      );
      return;
    }

    this.confirmAndImport(input, file!);
  }

  async confirmAndImport(input: HTMLInputElement, file: File) {
    if (!this.storageService.existAnyData()) {
      this.importFile(input, file, ImportMode.REPLACE);
    } else {
      this.confirmationService.confirm({
        message:
          'Existem dados no seu local storage.<br>Deseja que a importação sobrescreva os dados ou que as informações sejam mescladas?',
        header: 'Atenção!',
        icon: 'pi pi-exclamation-triangle',
        rejectButtonStyleClass: 'p-button-secondary',
        acceptButtonStyleClass: 'p-button-danger',
        acceptLabel: 'Sobrescrever',
        rejectLabel: 'Mesclar',
        accept: () => this.importFile(input, file, ImportMode.REPLACE),
        reject: () => this.importFile(input, file, ImportMode.MERGE),
      });
    }
  }

  async importFile(input: HTMLInputElement, file: File, importMode: ImportMode) {
    try {
      const result = await this.backupService.import(file!, importMode);
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

  fileValid(file: File | undefined) {
    if (!file) return false;

    const type = file?.type?.split('/')[1];
    if (!type || type != 'json') return false;

    return true;
  }
}
