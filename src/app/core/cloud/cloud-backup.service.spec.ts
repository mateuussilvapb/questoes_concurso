//Angular
import { TestBed } from '@angular/core/testing';

//Aplicação
import { CloudBackupService, ConflitoRevisaoError, ManifestBackup, StatusVerificacaoNuvem } from './cloud-backup.service';
import { GoogleAuthService } from './google-auth.service';
import { GoogleDriveClient, DriveFile } from './google-drive.client';
import { SyncStateService } from '../sync/sync-state.service';
import { BackupService } from '../../pages/configuracoes/core/services/backup.service';
import { BackupData, ImportMode } from '../storage/backup.models';

describe('CloudBackupService', () => {
  let service: CloudBackupService;

  let googleAuth: {
    estaAutenticado: ReturnType<typeof vi.fn>;
    signIn: ReturnType<typeof vi.fn>;
    contaConectada: ReturnType<typeof vi.fn>;
    obterAccessToken: ReturnType<typeof vi.fn>;
    tentarRestaurarSessao: ReturnType<typeof vi.fn>;
  };
  let driveClient: {
    listarArquivos: ReturnType<typeof vi.fn>;
    baixarConteudo: ReturnType<typeof vi.fn>;
    criarArquivo: ReturnType<typeof vi.fn>;
    criarPasta: ReturnType<typeof vi.fn>;
    atualizarArquivo: ReturnType<typeof vi.fn>;
    apagar: ReturnType<typeof vi.fn>;
  };
  let syncState: {
    contaAtual: ReturnType<typeof vi.fn>;
    definirContaAtual: ReturnType<typeof vi.fn>;
    obterRevisaoSincronizada: ReturnType<typeof vi.fn>;
    definirRevisaoSincronizada: ReturnType<typeof vi.fn>;
  };
  let backupService: {
    buildBackup: ReturnType<typeof vi.fn>;
    importarDeBackup: ReturnType<typeof vi.fn>;
  };

  function criarBackup(overrides: Partial<BackupData> = {}): BackupData {
    return {
      versao: 2,
      exportadoEm: '2026-08-11T10:00:00.000Z',
      dispositivoId: 'dispositivo-1',
      dispositivoNome: 'Notebook',
      materias: [{}] as BackupData['materias'],
      assuntos: [],
      bancas: [],
      questoes: [],
      historicos: [],
      ...overrides,
    };
  }

  beforeEach(() => {
    googleAuth = {
      estaAutenticado: vi.fn(() => true),
      signIn: vi.fn(() => Promise.resolve()),
      contaConectada: vi.fn(() => 'fulano@gmail.com'),
      obterAccessToken: vi.fn(() => Promise.resolve('token-abc')),
      tentarRestaurarSessao: vi.fn(() => Promise.resolve(true)),
    };

    driveClient = {
      listarArquivos: vi.fn(() => Promise.resolve([] as DriveFile[])),
      baixarConteudo: vi.fn(),
      criarArquivo: vi.fn(() => Promise.resolve('arquivo-id')),
      criarPasta: vi.fn(() => Promise.resolve('pasta-id')),
      atualizarArquivo: vi.fn(() => Promise.resolve()),
      apagar: vi.fn(() => Promise.resolve()),
    };

    syncState = {
      contaAtual: vi.fn(() => 'fulano@gmail.com'),
      definirContaAtual: vi.fn(),
      obterRevisaoSincronizada: vi.fn(() => 0),
      definirRevisaoSincronizada: vi.fn(),
    };

    backupService = {
      buildBackup: vi.fn(() => Promise.resolve(criarBackup())),
      importarDeBackup: vi.fn(() =>
        Promise.resolve({
          versaoOrigem: 2,
          materias: { imported: 1, ignored: 0 },
          assuntos: { imported: 0, ignored: 0 },
          bancas: { imported: 0, ignored: 0 },
          questoes: { imported: 0, ignored: 0 },
          historicos: { imported: 0, ignored: 0 },
        }),
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        CloudBackupService,
        { provide: GoogleAuthService, useValue: googleAuth },
        { provide: GoogleDriveClient, useValue: driveClient },
        { provide: SyncStateService, useValue: syncState },
        { provide: BackupService, useValue: backupService },
      ],
    });

    service = TestBed.inject(CloudBackupService);
  });

  describe('enviarBackup', () => {
    it('cria a pasta, envia a revisão 1 e o manifest quando não há nada na nuvem ainda', async () => {
      const manifest = await service.enviarBackup();

      expect(driveClient.criarPasta).toHaveBeenCalledWith('Questões Concurso - Backups');
      expect(driveClient.criarArquivo).toHaveBeenCalledWith(
        'backup-0001.json',
        expect.stringContaining('"revisao": 1'),
        'pasta-id',
      );
      expect(driveClient.criarArquivo).toHaveBeenCalledWith(
        'manifest.json',
        expect.any(String),
        'pasta-id',
      );
      expect(syncState.definirRevisaoSincronizada).toHaveBeenCalledWith('fulano@gmail.com', 1);
      expect(manifest.revisao).toBe(1);
      expect(manifest.totais.materias).toBe(1);
    });

    it('incrementa a revisão e atualiza (não recria) o manifest existente', async () => {
      const manifestExistente: ManifestBackup = {
        revisao: 3,
        schemaVersao: 2,
        exportadoEm: '2026-08-01T00:00:00.000Z',
        dispositivoId: 'outro-dispositivo',
        dispositivoNome: 'Celular',
        arquivoId: 'backup-antigo-id',
        totais: { materias: 0, assuntos: 0, bancas: 0, questoes: 0, historicos: 0 },
      };

      driveClient.listarArquivos.mockImplementation((query: string) => {
        if (query.includes("mimeType = 'application/vnd.google-apps.folder'")) {
          return Promise.resolve([{ id: 'pasta-id', nome: 'Questões Concurso - Backups' }]);
        }
        if (query.includes("name = 'manifest.json'")) {
          return Promise.resolve([{ id: 'manifest-id', nome: 'manifest.json' }]);
        }
        return Promise.resolve([]);
      });
      driveClient.baixarConteudo.mockResolvedValue(JSON.stringify(manifestExistente));
      syncState.obterRevisaoSincronizada.mockReturnValue(3);

      const manifest = await service.enviarBackup();

      expect(manifest.revisao).toBe(4);
      expect(driveClient.criarArquivo).toHaveBeenCalledWith(
        'backup-0004.json',
        expect.any(String),
        'pasta-id',
      );
      expect(driveClient.atualizarArquivo).toHaveBeenCalledWith('manifest-id', expect.any(String));
      expect(driveClient.criarArquivo).not.toHaveBeenCalledWith(
        'manifest.json',
        expect.any(String),
        'pasta-id',
      );
    });

    it('lança ConflitoRevisaoError quando a nuvem está mais nova que a última revisão sincronizada', async () => {
      const manifestRemoto: ManifestBackup = {
        revisao: 5,
        schemaVersao: 2,
        exportadoEm: '2026-08-01T00:00:00.000Z',
        dispositivoId: 'outro-dispositivo',
        dispositivoNome: 'Celular',
        arquivoId: 'x',
        totais: { materias: 0, assuntos: 0, bancas: 0, questoes: 0, historicos: 0 },
      };

      driveClient.listarArquivos.mockImplementation((query: string) => {
        if (query.includes("mimeType = 'application/vnd.google-apps.folder'")) {
          return Promise.resolve([{ id: 'pasta-id', nome: 'Questões Concurso - Backups' }]);
        }
        if (query.includes("name = 'manifest.json'")) {
          return Promise.resolve([{ id: 'manifest-id', nome: 'manifest.json' }]);
        }
        return Promise.resolve([]);
      });
      driveClient.baixarConteudo.mockResolvedValue(JSON.stringify(manifestRemoto));
      syncState.obterRevisaoSincronizada.mockReturnValue(2);

      await expect(service.enviarBackup()).rejects.toBeInstanceOf(ConflitoRevisaoError);
      expect(driveClient.criarArquivo).not.toHaveBeenCalled();
    });

    it('com forcar:true, ignora o conflito e sobrescreve mesmo assim', async () => {
      const manifestRemoto: ManifestBackup = {
        revisao: 5,
        schemaVersao: 2,
        exportadoEm: '2026-08-01T00:00:00.000Z',
        dispositivoId: 'outro-dispositivo',
        dispositivoNome: 'Celular',
        arquivoId: 'x',
        totais: { materias: 0, assuntos: 0, bancas: 0, questoes: 0, historicos: 0 },
      };

      driveClient.listarArquivos.mockImplementation((query: string) => {
        if (query.includes("mimeType = 'application/vnd.google-apps.folder'")) {
          return Promise.resolve([{ id: 'pasta-id', nome: 'Questões Concurso - Backups' }]);
        }
        if (query.includes("name = 'manifest.json'")) {
          return Promise.resolve([{ id: 'manifest-id', nome: 'manifest.json' }]);
        }
        return Promise.resolve([]);
      });
      driveClient.baixarConteudo.mockResolvedValue(JSON.stringify(manifestRemoto));
      syncState.obterRevisaoSincronizada.mockReturnValue(2);

      const manifest = await service.enviarBackup({ forcar: true });

      expect(manifest.revisao).toBe(6);
    });

    it('autentica automaticamente quando ainda não há sessão', async () => {
      googleAuth.estaAutenticado.mockReturnValue(false);
      googleAuth.tentarRestaurarSessao.mockResolvedValue(false);

      await service.enviarBackup();

      expect(googleAuth.signIn).toHaveBeenCalled();
    });

    it('retoma a sessão em silêncio (sem signIn) quando a renovação silenciosa funciona', async () => {
      googleAuth.estaAutenticado.mockReturnValue(false);
      googleAuth.tentarRestaurarSessao.mockResolvedValue(true);

      await service.enviarBackup();

      expect(googleAuth.signIn).not.toHaveBeenCalled();
    });

    it('lança erro claro quando não há conta conectada', async () => {
      googleAuth.contaConectada.mockReturnValue(null);

      await expect(service.enviarBackup()).rejects.toThrow('Nenhuma conta Google conectada.');
    });

    it('apaga as revisões além das 5 mais recentes após enviar', async () => {
      const arquivosExistentes: DriveFile[] = [
        { id: 'p', nome: 'Questões Concurso - Backups' },
      ];

      driveClient.listarArquivos.mockImplementation((query: string) => {
        if (query.includes("mimeType = 'application/vnd.google-apps.folder'")) {
          return Promise.resolve([{ id: 'pasta-id', nome: 'Questões Concurso - Backups' }]);
        }
        if (query.includes("name = 'manifest.json'")) {
          return Promise.resolve([]);
        }
        if (query.includes("name contains 'backup-'")) {
          return Promise.resolve([
            { id: 'r1', nome: 'backup-0001.json' },
            { id: 'r2', nome: 'backup-0002.json' },
            { id: 'r3', nome: 'backup-0003.json' },
            { id: 'r4', nome: 'backup-0004.json' },
            { id: 'r5', nome: 'backup-0005.json' },
            { id: 'r6', nome: 'backup-0006.json' },
          ]);
        }
        return Promise.resolve(arquivosExistentes);
      });

      await service.enviarBackup();

      expect(driveClient.apagar).toHaveBeenCalledWith('r1');
      expect(driveClient.apagar).toHaveBeenCalledTimes(1);
    });
  });

  describe('listarRevisoes', () => {
    it('ignora arquivos que não seguem o padrão backup-000N.json e ordena da mais nova para a mais antiga', async () => {
      driveClient.listarArquivos.mockImplementation((query: string) => {
        if (query.includes("mimeType = 'application/vnd.google-apps.folder'")) {
          return Promise.resolve([{ id: 'pasta-id', nome: 'Questões Concurso - Backups' }]);
        }
        return Promise.resolve([
          { id: 'r1', nome: 'backup-0001.json' },
          { id: 'r3', nome: 'backup-0003.json' },
          { id: 'lixo', nome: 'backup-antigo.json' },
        ]);
      });

      const revisoes = await service.listarRevisoes();

      expect(revisoes).toEqual([
        { revisao: 3, arquivoId: 'r3', nome: 'backup-0003.json' },
        { revisao: 1, arquivoId: 'r1', nome: 'backup-0001.json' },
      ]);
    });
  });

  describe('restaurarRevisao', () => {
    it('baixa o conteúdo, importa em modo REPLACE e grava a revisão sincronizada', async () => {
      const backupRemoto = criarBackup({ revisao: 3 });
      driveClient.baixarConteudo.mockResolvedValue(JSON.stringify(backupRemoto));

      await service.restaurarRevisao('arquivo-id', 3);

      expect(backupService.importarDeBackup).toHaveBeenCalledWith(backupRemoto, ImportMode.REPLACE);
      expect(syncState.definirRevisaoSincronizada).toHaveBeenCalledWith('fulano@gmail.com', 3);
    });
  });

  describe('invalidarSincronizacaoAposImportacaoLocal', () => {
    it('zera a revisão sincronizada da conta conectada', () => {
      service.invalidarSincronizacaoAposImportacaoLocal();

      expect(syncState.definirRevisaoSincronizada).toHaveBeenCalledWith('fulano@gmail.com', 0);
    });

    it('não faz nada quando não há conta conectada', () => {
      googleAuth.contaConectada.mockReturnValue(null);

      service.invalidarSincronizacaoAposImportacaoLocal();

      expect(syncState.definirRevisaoSincronizada).not.toHaveBeenCalled();
    });
  });

  describe('verificarAtualizacoes', () => {
    it('retorna sem-sessao sem tentar autenticar quando não há token válido nem renovável', async () => {
      googleAuth.tentarRestaurarSessao.mockResolvedValue(false);

      const status: StatusVerificacaoNuvem = await service.verificarAtualizacoes();

      expect(status).toEqual({ tipo: 'sem-sessao' });
      expect(googleAuth.signIn).not.toHaveBeenCalled();
    });

    it('retorna troca-de-conta quando a conta conectada difere da última usada neste dispositivo', async () => {
      syncState.contaAtual.mockReturnValue('outra-conta@gmail.com');

      const status = await service.verificarAtualizacoes();

      expect(status).toEqual({
        tipo: 'troca-de-conta',
        contaAnterior: 'outra-conta@gmail.com',
        contaAtual: 'fulano@gmail.com',
      });
      expect(driveClient.listarArquivos).not.toHaveBeenCalled();
    });

    it('retorna atualizado quando a pasta do app ainda não existe no Drive', async () => {
      syncState.contaAtual.mockReturnValue(null);
      driveClient.listarArquivos.mockResolvedValue([]);

      const status = await service.verificarAtualizacoes();

      expect(status).toEqual({ tipo: 'atualizado' });
      expect(driveClient.criarPasta).not.toHaveBeenCalled();
    });

    it('retorna atualizacao-disponivel quando a revisão remota é mais nova que a local', async () => {
      syncState.contaAtual.mockReturnValue('fulano@gmail.com');
      syncState.obterRevisaoSincronizada.mockReturnValue(2);

      const manifestRemoto: ManifestBackup = {
        revisao: 5,
        schemaVersao: 2,
        exportadoEm: '2026-08-10T00:00:00.000Z',
        dispositivoId: 'outro-dispositivo',
        dispositivoNome: 'Celular',
        arquivoId: 'x',
        totais: { materias: 0, assuntos: 0, bancas: 0, questoes: 0, historicos: 0 },
      };

      driveClient.listarArquivos.mockImplementation((query: string) => {
        if (query.includes("mimeType = 'application/vnd.google-apps.folder'")) {
          return Promise.resolve([{ id: 'pasta-id', nome: 'Questões Concurso - Backups' }]);
        }
        return Promise.resolve([{ id: 'manifest-id', nome: 'manifest.json' }]);
      });
      driveClient.baixarConteudo.mockResolvedValue(JSON.stringify(manifestRemoto));

      const status = await service.verificarAtualizacoes();

      expect(status).toEqual({
        tipo: 'atualizacao-disponivel',
        manifestRemoto,
        revisaoLocal: 2,
      });
    });

    it('retorna atualizado quando a revisão remota já foi sincronizada por este dispositivo', async () => {
      syncState.contaAtual.mockReturnValue('fulano@gmail.com');
      syncState.obterRevisaoSincronizada.mockReturnValue(5);

      const manifestRemoto: ManifestBackup = {
        revisao: 5,
        schemaVersao: 2,
        exportadoEm: '2026-08-10T00:00:00.000Z',
        dispositivoId: 'dispositivo-1',
        dispositivoNome: 'Notebook',
        arquivoId: 'x',
        totais: { materias: 0, assuntos: 0, bancas: 0, questoes: 0, historicos: 0 },
      };

      driveClient.listarArquivos.mockImplementation((query: string) => {
        if (query.includes("mimeType = 'application/vnd.google-apps.folder'")) {
          return Promise.resolve([{ id: 'pasta-id', nome: 'Questões Concurso - Backups' }]);
        }
        return Promise.resolve([{ id: 'manifest-id', nome: 'manifest.json' }]);
      });
      driveClient.baixarConteudo.mockResolvedValue(JSON.stringify(manifestRemoto));

      const status = await service.verificarAtualizacoes();

      expect(status).toEqual({ tipo: 'atualizado' });
    });
  });
});
