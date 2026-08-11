//Angular
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

//Aplicação
import { BackupService } from '../../core/services/backup.service';
import { ImportMode, MergeResult } from '../../../../core/storage/backup.models';
import { MessageService } from '../../../../shared/services/message.service';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';
import { DispositivoService } from '../../../../core/sync/dispositivo.service';
import { GoogleAuthService } from '../../../../core/cloud/google-auth.service';
import {
  CloudBackupService,
  ConflitoRevisaoError,
  ManifestBackup,
  RevisaoRemota,
} from '../../../../core/cloud/cloud-backup.service';

//Externo
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
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
    TagModule,
    InputTextModule,
  ],
  templateUrl: './backup-restauracao.html',
})
export class BackupRestauracao {
  private readonly backupService = inject(BackupService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly dispositivoService = inject(DispositivoService);
  private readonly googleAuth = inject(GoogleAuthService);
  private readonly cloudBackupService = inject(CloudBackupService);

  readonly ultimaExportacaoEm = signal<string | null>(
    localStorage.getItem(CHAVE_ULTIMA_EXPORTACAO),
  );

  readonly ultimoResultadoImportacao = signal<MergeResult | null>(null);

  readonly contaConectada = this.googleAuth.contaConectada;
  readonly nomeDispositivo = this.dispositivoService.nome;

  readonly conectando = signal(false);
  readonly enviandoBackup = signal(false);
  readonly carregandoRevisoes = signal(false);
  readonly revisoes = signal<RevisaoRemota[]>([]);
  readonly ultimoManifestEnviado = signal<ManifestBackup | null>(null);

  readonly editandoNomeDispositivo = signal(false);
  readonly nomeDispositivoEmEdicao = signal('');

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

  // ======================================================
  // BACKUP NA NUVEM
  // ======================================================

  async conectar(): Promise<void> {
    this.conectando.set(true);
    try {
      await this.googleAuth.signIn();
      this.messageService.showSuccess(
        `Conectado como ${this.googleAuth.contaConectada()}`,
        'Conectado!',
      );
      await this.carregarRevisoes();
    } catch (error) {
      console.error(error);
      this.messageService.showError('Não foi possível conectar ao Google. Tente novamente', 'Erro!');
    } finally {
      this.conectando.set(false);
    }
  }

  async desconectar(): Promise<void> {
    await this.googleAuth.signOut();
    this.revisoes.set([]);
    this.ultimoManifestEnviado.set(null);
    this.messageService.showSuccess('Desconectado do Google Drive.', 'Desconectado');
  }

  async enviarParaDrive(): Promise<void> {
    await this.executarEnvio({});
  }

  private async executarEnvio(opcoes: { forcar?: boolean }): Promise<void> {
    this.enviandoBackup.set(true);
    try {
      const manifest = await this.cloudBackupService.enviarBackup(opcoes);

      this.ultimoManifestEnviado.set(manifest);
      this.messageService.showSuccess('Backup enviado para o Drive com sucesso!', 'Sucesso!');
      await this.carregarRevisoes();
    } catch (error) {
      if (error instanceof ConflitoRevisaoError) {
        this.confirmarSobrescritaConflito(error);
        return;
      }

      console.error(error);
      this.messageService.showError('Erro ao enviar backup para o Drive. Tente novamente', 'Erro!');
    } finally {
      this.enviandoBackup.set(false);
    }
  }

  private confirmarSobrescritaConflito(erro: ConflitoRevisaoError): void {
    this.confirmationService.confirm({
      message: `A nuvem já tem uma revisão mais nova (nº ${erro.manifestRemoto.revisao}, enviada por "${erro.manifestRemoto.dispositivoNome}") que este dispositivo ainda não sincronizou.<br>Enviar mesmo assim vai sobrescrevê-la.`,
      header: 'Conflito de revisão',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Sobrescrever',
      rejectLabel: 'Cancelar',
      accept: () => this.executarEnvio({ forcar: true }),
    });
  }

  async carregarRevisoes(): Promise<void> {
    if (!this.contaConectada()) return;

    this.carregandoRevisoes.set(true);
    try {
      const lista = await this.cloudBackupService.listarRevisoes();
      this.revisoes.set(lista);
    } catch (error) {
      console.error(error);
    } finally {
      this.carregandoRevisoes.set(false);
    }
  }

  confirmarRestauracao(revisao: RevisaoRemota): void {
    this.confirmationService.confirm({
      message: `Restaurar a revisão nº ${revisao.revisao} vai substituir todos os dados locais deste dispositivo pelos dessa revisão.<br>Esta ação não pode ser desfeita.`,
      header: 'Restaurar backup da nuvem?',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Restaurar',
      rejectLabel: 'Cancelar',
      accept: () => this.restaurar(revisao),
    });
  }

  private async restaurar(revisao: RevisaoRemota): Promise<void> {
    try {
      const resultado = await this.cloudBackupService.restaurarRevisao(
        revisao.arquivoId,
        revisao.revisao,
      );

      this.ultimoResultadoImportacao.set(resultado);
      this.messageService.showSuccess('Backup restaurado com sucesso!', 'Sucesso!');
    } catch (error) {
      console.error(error);
      this.messageService.showError('Erro ao restaurar backup. Tente novamente', 'Erro!');
    }
  }

  iniciarEdicaoNomeDispositivo(): void {
    this.nomeDispositivoEmEdicao.set(this.nomeDispositivo());
    this.editandoNomeDispositivo.set(true);
  }

  atualizarNomeDispositivoEmEdicao(valor: string): void {
    this.nomeDispositivoEmEdicao.set(valor);
  }

  salvarNomeDispositivo(): void {
    this.dispositivoService.renomear(this.nomeDispositivoEmEdicao());
    this.editandoNomeDispositivo.set(false);
  }

  cancelarEdicaoNomeDispositivo(): void {
    this.editandoNomeDispositivo.set(false);
  }
}
