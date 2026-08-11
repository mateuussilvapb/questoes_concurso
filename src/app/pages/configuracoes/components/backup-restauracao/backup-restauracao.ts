//Angular
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

//Aplicação
import { BackupService } from '../../core/services/backup.service';
import { ImportMode, MergeResult } from '../../../../core/storage/backup.models';
import { MessageService } from '../../../../shared/services/message.service';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';

//Externo
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';

interface LinhaResumoImportacao {
  label: string;
  imported: number;
  ignored: number;
}

const CHAVE_ULTIMA_EXPORTACAO = 'questoes-concurso.ultima-exportacao-em';

const LABELS_ENTIDADE: Record<keyof Omit<MergeResult, 'versaoOrigem'>, string> = {
  materias: 'Matérias',
  assuntos: 'Assuntos',
  bancas: 'Bancas',
  questoes: 'Questões',
  historicos: 'Histórico',
};

@Component({
  selector: 'app-backup-restauracao',
  imports: [
    //Angular
    CommonModule,

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
  private readonly confirmationService = inject(ConfirmationService);

  readonly ultimaExportacaoEm = signal<string | null>(
    localStorage.getItem(CHAVE_ULTIMA_EXPORTACAO),
  );

  readonly ultimoResultadoImportacao = signal<MergeResult | null>(null);

  readonly linhasResumoImportacao = computed<LinhaResumoImportacao[]>(() => {
    const resultado = this.ultimoResultadoImportacao();

    if (!resultado) return [];

    return (Object.keys(LABELS_ENTIDADE) as (keyof typeof LABELS_ENTIDADE)[]).map((chave) => ({
      label: LABELS_ENTIDADE[chave],
      imported: resultado[chave].imported,
      ignored: resultado[chave].ignored,
    }));
  });

  async backup(): Promise<void> {
    await this.backupService.export();

    const agora = new Date().toISOString();
    localStorage.setItem(CHAVE_ULTIMA_EXPORTACAO, agora);
    this.ultimaExportacaoEm.set(agora);
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
    if (!(await this.backupService.existAnyData())) {
      this.importFile(input, file, ImportMode.REPLACE);
    } else {
      this.confirmationService.confirm({
        message:
          'Já existem dados salvos.<br>Deseja que a importação sobrescreva os dados ou que as informações sejam mescladas?',
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

      const mensagem =
        result.versaoOrigem === 1
          ? 'Arquivo importado com sucesso! É um backup de uma versão anterior do sistema — as bancas não estavam presentes nele.'
          : 'Arquivo importado com sucesso!';

      this.messageService.showSuccess(mensagem, 'Sucesso!');
      this.ultimoResultadoImportacao.set(result);
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
