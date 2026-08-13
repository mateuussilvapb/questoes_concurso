//Angular
import { Injectable, inject } from '@angular/core';

//Aplicação
import { GoogleAuthService } from './google-auth.service';
import { GoogleDriveClient } from './google-drive.client';
import { SyncStateService } from '../sync/sync-state.service';
import { BackupService } from '../../pages/configuracoes/core/services/backup.service';
import { BackupData, ImportMode, MergeResult } from '../storage/backup.models';

const NOME_PASTA = 'Questões Concurso - Backups';
const NOME_MANIFEST = 'manifest.json';
/** Quantidade de revisões mantidas no Drive; o restante é apagado a cada envio (§2.2 do plano). */
const MAX_REVISOES = 5;

export interface ManifestBackup {
  revisao: number;
  schemaVersao: number;
  exportadoEm: string;
  dispositivoId: string;
  dispositivoNome: string;
  arquivoId: string;
  totais: {
    materias: number;
    assuntos: number;
    bancas: number;
    questoes: number;
    historicos: number;
  };
}

export interface RevisaoRemota {
  revisao: number;
  arquivoId: string;
  nome: string;
}

interface ManifestLido {
  manifest: ManifestBackup;
  arquivoIdManifest: string;
}

/**
 * Resultado da verificação passiva feita na abertura do app (§3.2/Fase 4).
 * Nunca força autenticação — só aproveita uma sessão/token já válidos.
 */
export type StatusVerificacaoNuvem =
  | { tipo: 'sem-sessao' }
  | { tipo: 'atualizado' }
  | { tipo: 'troca-de-conta'; contaAnterior: string; contaAtual: string }
  | { tipo: 'atualizacao-disponivel'; manifestRemoto: ManifestBackup; revisaoLocal: number };

/**
 * Backup remoto é mais novo que a última revisão que este dispositivo
 * enviou ou restaurou (§3.1 do plano) — quem chama decide se restaura antes
 * de enviar ou sobrescreve (enviarBackup({ forcar: true })).
 */
export class ConflitoRevisaoError extends Error {
  constructor(readonly manifestRemoto: ManifestBackup) {
    super('A nuvem tem uma revisão mais nova que este dispositivo ainda não sincronizou.');
  }
}

/**
 * Orquestra BackupService + GoogleDriveClient: monta e envia snapshots
 * versionados (manifest + backup-000N.json), restaura uma revisão e poda as
 * mais antigas. Não guarda estado de UI — quem exibe diálogos/confirmações é
 * a Fase 3 (tela de Configurações) e a Fase 4 (verificação na abertura).
 */
@Injectable({
  providedIn: 'root',
})
export class CloudBackupService {
  private readonly googleAuth = inject(GoogleAuthService);
  private readonly driveClient = inject(GoogleDriveClient);
  private readonly syncState = inject(SyncStateService);
  private readonly backupService = inject(BackupService);

  private pastaIdCache: string | null = null;

  async enviarBackup(opcoes: { forcar?: boolean } = {}): Promise<ManifestBackup> {
    await this.garantirAutenticado();

    const conta = this.contaAtualOuLanca();
    const pastaId = await this.garantirPasta();
    const manifestAtual = await this.lerManifest(pastaId);

    const revisaoSincronizada = this.syncState.obterRevisaoSincronizada(conta);

    if (manifestAtual && manifestAtual.manifest.revisao > revisaoSincronizada && !opcoes.forcar) {
      throw new ConflitoRevisaoError(manifestAtual.manifest);
    }

    const backup = await this.backupService.buildBackup();
    const novaRevisao = (manifestAtual?.manifest.revisao ?? 0) + 1;

    backup.revisao = novaRevisao;

    const arquivoId = await this.driveClient.criarArquivo(
      this.nomeArquivoRevisao(novaRevisao),
      JSON.stringify(backup, null, 2),
      pastaId,
    );

    const manifest = this.montarManifest(backup, novaRevisao, arquivoId);

    await this.gravarManifest(pastaId, manifest, manifestAtual);

    this.syncState.definirRevisaoSincronizada(conta, novaRevisao);

    await this.podarRevisoesAntigas(pastaId);

    return manifest;
  }

  /**
   * Chamada após o primeiro render (Fase 4), nunca em boot bloqueante.
   * Só aproveita uma sessão já válida (token em cache ou renovável em
   * silêncio) — se não houver, retorna 'sem-sessao' em vez de abrir o
   * popup de consentimento (§6.1: fallback manual é parte do desenho).
   */
  async verificarAtualizacoes(): Promise<StatusVerificacaoNuvem> {
    // Só aproveita sessão retomável em silêncio; nunca inicia login.
    if (!(await this.googleAuth.tentarRestaurarSessao())) {
      return { tipo: 'sem-sessao' };
    }

    const conta = this.googleAuth.contaConectada();

    if (!conta) {
      return { tipo: 'sem-sessao' };
    }

    const contaAnterior = this.syncState.contaAtual();

    if (contaAnterior && contaAnterior !== conta) {
      return { tipo: 'troca-de-conta', contaAnterior, contaAtual: conta };
    }

    this.syncState.definirContaAtual(conta);

    const pastaId = await this.buscarPastaSeExistir();

    if (!pastaId) {
      return { tipo: 'atualizado' };
    }

    const manifestAtual = await this.lerManifest(pastaId);

    if (!manifestAtual) {
      return { tipo: 'atualizado' };
    }

    const revisaoLocal = this.syncState.obterRevisaoSincronizada(conta);

    if (manifestAtual.manifest.revisao > revisaoLocal) {
      return {
        tipo: 'atualizacao-disponivel',
        manifestRemoto: manifestAtual.manifest,
        revisaoLocal,
      };
    }

    return { tipo: 'atualizado' };
  }

  /**
   * Importar um arquivo local em modo REPLACE troca o conteúdo do
   * dispositivo sem nenhuma relação com a revisão da nuvem — o
   * `revisaoSincronizada` continuaria apontando para uma proveniência que
   * não existe mais. Zera o marcador da conta conectada (se houver) para
   * que o próximo envio veja a nuvem como "mais nova" e exija confirmação
   * antes de sobrescrevê-la (mesmo diálogo de ConflitoRevisaoError), em vez
   * de subir silenciosamente um conteúdo que pode ser mais antigo ou
   * completamente diferente do que já estava lá.
   */
  invalidarSincronizacaoAposImportacaoLocal(): void {
    const conta = this.googleAuth.contaConectada();

    if (conta) {
      this.syncState.definirRevisaoSincronizada(conta, 0);
    }
  }

  async listarRevisoes(): Promise<RevisaoRemota[]> {
    await this.garantirAutenticado();

    const pastaId = await this.garantirPasta();

    return this.listarRevisoesNaPasta(pastaId);
  }

  async restaurarRevisao(arquivoId: string, revisao: number): Promise<MergeResult> {
    await this.garantirAutenticado();

    const conteudo = await this.driveClient.baixarConteudo(arquivoId);
    const backup = JSON.parse(conteudo) as BackupData;

    const resultado = await this.backupService.importarDeBackup(backup, ImportMode.REPLACE);

    this.syncState.definirRevisaoSincronizada(this.contaAtualOuLanca(), revisao);

    return resultado;
  }

  private montarManifest(backup: BackupData, revisao: number, arquivoId: string): ManifestBackup {
    return {
      revisao,
      schemaVersao: backup.versao,
      exportadoEm: backup.exportadoEm,
      dispositivoId: backup.dispositivoId ?? '',
      dispositivoNome: backup.dispositivoNome ?? '',
      arquivoId,
      totais: {
        materias: backup.materias.length,
        assuntos: backup.assuntos.length,
        bancas: backup.bancas.length,
        questoes: backup.questoes.length,
        historicos: backup.historicos.length,
      },
    };
  }

  private async gravarManifest(
    pastaId: string,
    manifest: ManifestBackup,
    atual: ManifestLido | null,
  ): Promise<void> {
    const conteudo = JSON.stringify(manifest, null, 2);

    if (atual) {
      await this.driveClient.atualizarArquivo(atual.arquivoIdManifest, conteudo);
    } else {
      await this.driveClient.criarArquivo(NOME_MANIFEST, conteudo, pastaId);
    }
  }

  private async podarRevisoesAntigas(pastaId: string): Promise<void> {
    const revisoes = await this.listarRevisoesNaPasta(pastaId);
    const excedentes = revisoes.slice(MAX_REVISOES);

    await Promise.all(excedentes.map((revisao) => this.driveClient.apagar(revisao.arquivoId)));
  }

  private async listarRevisoesNaPasta(pastaId: string): Promise<RevisaoRemota[]> {
    const arquivos = await this.driveClient.listarArquivos(
      `'${pastaId}' in parents and name contains 'backup-' and trashed = false`,
    );

    return arquivos
      .map((arquivo) => ({
        revisao: this.extrairRevisaoDoNome(arquivo.nome),
        arquivoId: arquivo.id,
        nome: arquivo.nome,
      }))
      .filter((revisao): revisao is RevisaoRemota => revisao.revisao !== null)
      .sort((a, b) => b.revisao - a.revisao);
  }

  private async lerManifest(pastaId: string): Promise<ManifestLido | null> {
    const encontrados = await this.driveClient.listarArquivos(
      `'${pastaId}' in parents and name = '${NOME_MANIFEST}' and trashed = false`,
    );

    if (!encontrados.length) return null;

    const conteudo = await this.driveClient.baixarConteudo(encontrados[0].id);

    return {
      manifest: JSON.parse(conteudo) as ManifestBackup,
      arquivoIdManifest: encontrados[0].id,
    };
  }

  private async garantirPasta(): Promise<string> {
    if (this.pastaIdCache) return this.pastaIdCache;

    const existente = await this.buscarPastaSeExistir();

    this.pastaIdCache = existente ?? (await this.driveClient.criarPasta(NOME_PASTA));

    return this.pastaIdCache;
  }

  /** Só busca, nunca cria — usado pela verificação passiva (não deve ter esse efeito colateral). */
  private async buscarPastaSeExistir(): Promise<string | null> {
    if (this.pastaIdCache) return this.pastaIdCache;

    const encontradas = await this.driveClient.listarArquivos(
      `name = '${NOME_PASTA}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    );

    return encontradas[0]?.id ?? null;
  }

  private async garantirAutenticado(): Promise<void> {
    if (this.googleAuth.estaAutenticado()) return;
    if (await this.googleAuth.tentarRestaurarSessao()) return;

    await this.googleAuth.signIn();
  }

  private contaAtualOuLanca(): string {
    const conta = this.googleAuth.contaConectada();

    if (!conta) {
      throw new Error('Nenhuma conta Google conectada.');
    }

    if (this.syncState.contaAtual() !== conta) {
      this.syncState.definirContaAtual(conta);
    }

    return conta;
  }

  private nomeArquivoRevisao(revisao: number): string {
    return `backup-${String(revisao).padStart(4, '0')}.json`;
  }

  private extrairRevisaoDoNome(nome: string): number | null {
    const match = /^backup-(\d+)\.json$/.exec(nome);

    return match ? Number(match[1]) : null;
  }
}
