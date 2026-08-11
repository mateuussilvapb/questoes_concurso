//Angular
import { Component, afterNextRender, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

//Aplicação
import { Toast } from './shared/components/toast/toast';
import { FloatingTimer } from './core/timer/components/floating-timer/floating-timer';
import { LoadingOverlay } from './shared/components/loading-overlay/loading-overlay';
import { MessageService } from './shared/services/message.service';
import { GoogleAuthService } from './core/cloud/google-auth.service';
import {
  CloudBackupService,
  ManifestBackup,
  StatusVerificacaoNuvem,
} from './core/cloud/cloud-backup.service';

//Externos
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-root',
  imports: [
    //Angular
    RouterOutlet,

    //Aplicação
    Toast,
    FloatingTimer,
    LoadingOverlay,

    //Externos
    ConfirmDialogModule,
    ButtonModule,
  ],
  templateUrl: './app.html',
})
export class App {
  private readonly cloudBackupService = inject(CloudBackupService);
  private readonly googleAuth = inject(GoogleAuthService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  /** Fallback do §6.1: sem sessão válida, oferece um jeito manual em vez de insistir em autenticar. */
  readonly mostrarVerificacaoManual = signal(false);
  readonly verificandoManualmente = signal(false);

  constructor() {
    afterNextRender(() => {
      void this.verificarBackupNaNuvem();
    });
  }

  async verificarNuvemManualmente(): Promise<void> {
    this.verificandoManualmente.set(true);

    try {
      await this.googleAuth.signIn();

      const status = await this.cloudBackupService.verificarAtualizacoes();

      this.tratarStatus(status);

      if (status.tipo === 'atualizado') {
        this.messageService.showInfo(
          'Seus dados já estão atualizados em relação à nuvem.',
          'Tudo certo',
        );
      }
    } catch (error) {
      console.error(error);
      this.messageService.showError('Não foi possível conectar ao Google. Tente novamente', 'Erro!');
    } finally {
      this.verificandoManualmente.set(false);
    }
  }

  private async verificarBackupNaNuvem(): Promise<void> {
    const status = await this.cloudBackupService.verificarAtualizacoes();

    this.tratarStatus(status);
  }

  private tratarStatus(status: StatusVerificacaoNuvem): void {
    this.mostrarVerificacaoManual.set(status.tipo === 'sem-sessao');

    if (status.tipo === 'troca-de-conta') {
      this.messageService.showWarning(
        `A conta Google conectada agora (${status.contaAtual}) é diferente da última usada neste dispositivo (${status.contaAnterior}). As revisões na nuvem não foram comparadas — confira em Configurações antes de enviar ou restaurar.`,
        'Conta do Google trocada',
      );
      return;
    }

    if (status.tipo === 'atualizacao-disponivel') {
      this.oferecerRestauracao(status.manifestRemoto, status.revisaoLocal);
    }
  }

  private oferecerRestauracao(manifest: ManifestBackup, revisaoLocal: number): void {
    const dataFormatada = new Date(manifest.exportadoEm).toLocaleString('pt-BR');

    this.confirmationService.confirm({
      header: 'Backup mais novo disponível na nuvem',
      message: `O dispositivo "${manifest.dispositivoNome}" enviou a revisão nº ${manifest.revisao} em ${dataFormatada}.<br>Este dispositivo está na revisão nº ${revisaoLocal}.<br>Restaurar substitui todos os dados locais pelos dessa revisão.`,
      icon: 'pi pi-cloud-download',
      acceptLabel: 'Restaurar agora',
      rejectLabel: 'Agora não',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.restaurarDaNuvem(manifest),
    });
  }

  private async restaurarDaNuvem(manifest: ManifestBackup): Promise<void> {
    try {
      await this.cloudBackupService.restaurarRevisao(manifest.arquivoId, manifest.revisao);
      this.messageService.showSuccess('Backup restaurado com sucesso!', 'Sucesso!');
    } catch (error) {
      console.error(error);
      this.messageService.showError('Erro ao restaurar backup da nuvem. Tente novamente', 'Erro!');
    }
  }
}
