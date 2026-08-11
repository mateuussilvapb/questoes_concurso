//Angular
import { TestBed } from '@angular/core/testing';

//Aplicação
import { GoogleDriveClient } from './google-drive.client';
import { GoogleAuthService } from './google-auth.service';

describe('GoogleDriveClient', () => {
  let client: GoogleDriveClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  function mockResposta(ok: boolean, corpo: unknown, texto?: string): Response {
    return {
      ok,
      status: ok ? 200 : 400,
      json: () => Promise.resolve(corpo),
      text: () => Promise.resolve(texto ?? JSON.stringify(corpo)),
    } as Response;
  }

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    TestBed.configureTestingModule({
      providers: [
        GoogleDriveClient,
        { provide: GoogleAuthService, useValue: { obterAccessToken: () => Promise.resolve('token-abc') } },
      ],
    });

    client = TestBed.inject(GoogleDriveClient);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lista arquivos aplicando a query e mapeando os campos', async () => {
    fetchMock.mockResolvedValue(
      mockResposta(true, {
        files: [{ id: '1', name: 'manifest.json', modifiedTime: '2026-08-11T10:00:00.000Z' }],
      }),
    );

    const arquivos = await client.listarArquivos("'pasta1' in parents");

    expect(arquivos).toEqual([
      { id: '1', nome: 'manifest.json', modificadoEm: '2026-08-11T10:00:00.000Z' },
    ]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('https://www.googleapis.com/drive/v3/files?');
    expect(url).toContain('q=%27pasta1%27+in+parents');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer token-abc');
  });

  it('baixa o conteúdo de um arquivo como texto', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"revisao":7}'),
    } as Response);

    const conteudo = await client.baixarConteudo('abc123');

    expect(conteudo).toBe('{"revisao":7}');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://www.googleapis.com/drive/v3/files/abc123?alt=media',
    );
  });

  it('cria uma pasta via metadata simples (sem multipart)', async () => {
    fetchMock.mockResolvedValue(mockResposta(true, { id: 'pasta-id' }));

    const id = await client.criarPasta('Questões Concurso - Backups');

    expect(id).toBe('pasta-id');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://www.googleapis.com/drive/v3/files');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'Questões Concurso - Backups',
      mimeType: 'application/vnd.google-apps.folder',
    });
  });

  it('cria um arquivo com conteúdo via upload multipart, dentro da pasta informada', async () => {
    fetchMock.mockResolvedValue(mockResposta(true, { id: 'arquivo-id' }));

    const id = await client.criarArquivo('manifest.json', '{"revisao":1}', 'pasta-id');

    expect(id).toBe('arquivo-id');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
    expect(init.body as string).toContain('"parents":["pasta-id"]');
    expect(init.body as string).toContain('{"revisao":1}');
  });

  it('atualiza o conteúdo de um arquivo existente', async () => {
    fetchMock.mockResolvedValue(mockResposta(true, {}));

    await client.atualizarArquivo('abc123', '{"revisao":2}');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://www.googleapis.com/upload/drive/v3/files/abc123?uploadType=media');
    expect(init.method).toBe('PATCH');
    expect(init.body).toBe('{"revisao":2}');
  });

  it('apaga um arquivo', async () => {
    fetchMock.mockResolvedValue(mockResposta(true, {}));

    await client.apagar('abc123');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://www.googleapis.com/drive/v3/files/abc123');
    expect(init.method).toBe('DELETE');
  });

  it('lança erro com o status e o corpo quando a resposta não é ok', async () => {
    fetchMock.mockResolvedValue(mockResposta(false, {}, 'Forbidden'));

    await expect(client.apagar('abc123')).rejects.toThrow(/400/);
  });
});
