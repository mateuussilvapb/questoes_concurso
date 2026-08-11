//Angular
import { Injectable, inject } from '@angular/core';

//Aplicação
import { GoogleAuthService } from './google-auth.service';

const FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const MIME_TYPE_PASTA = 'application/vnd.google-apps.folder';
const MULTIPART_BOUNDARY = 'questoes_concurso_backup';

export interface DriveFile {
  id: string;
  nome: string;
  modificadoEm?: string;
}

/**
 * Fetch cru contra a REST API do Google Drive (v3), sem SDK. Cada chamada
 * busca um access token válido em GoogleAuthService — não guarda estado
 * próprio. Opera só sobre arquivos criados pelo próprio app (escopo
 * `drive.file`, §2.4 do plano).
 */
@Injectable({
  providedIn: 'root',
})
export class GoogleDriveClient {
  private readonly googleAuth = inject(GoogleAuthService);

  async listarArquivos(query: string): Promise<DriveFile[]> {
    const params = new URLSearchParams({
      q: query,
      fields: 'files(id,name,modifiedTime)',
      spaces: 'drive',
    });

    const resposta = await this.requisitar(`${FILES_URL}?${params.toString()}`);

    const dados = (await resposta.json()) as {
      files: { id: string; name: string; modifiedTime: string }[];
    };

    return dados.files.map((arquivo) => ({
      id: arquivo.id,
      nome: arquivo.name,
      modificadoEm: arquivo.modifiedTime,
    }));
  }

  async baixarConteudo(fileId: string): Promise<string> {
    const resposta = await this.requisitar(`${FILES_URL}/${fileId}?alt=media`);

    return resposta.text();
  }

  async criarPasta(nome: string): Promise<string> {
    return this.criarArquivoInterno(nome, MIME_TYPE_PASTA);
  }

  async criarArquivo(
    nome: string,
    conteudo: string,
    pastaId: string,
    mimeType = 'application/json',
  ): Promise<string> {
    return this.criarArquivoInterno(nome, mimeType, conteudo, pastaId);
  }

  async atualizarArquivo(fileId: string, conteudo: string): Promise<void> {
    await this.requisitar(`${UPLOAD_URL}/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: conteudo,
    });
  }

  async apagar(fileId: string): Promise<void> {
    await this.requisitar(`${FILES_URL}/${fileId}`, { method: 'DELETE' });
  }

  private async criarArquivoInterno(
    nome: string,
    mimeType: string,
    conteudo?: string,
    pastaId?: string,
  ): Promise<string> {
    const metadata: Record<string, unknown> = { name: nome, mimeType };

    if (pastaId) {
      metadata['parents'] = [pastaId];
    }

    if (conteudo === undefined) {
      const resposta = await this.requisitar(FILES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      });

      return this.extrairId(resposta);
    }

    const corpo =
      `--${MULTIPART_BOUNDARY}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `--${MULTIPART_BOUNDARY}\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n${conteudo}\r\n` +
      `--${MULTIPART_BOUNDARY}--`;

    const resposta = await this.requisitar(`${UPLOAD_URL}?uploadType=multipart`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${MULTIPART_BOUNDARY}` },
      body: corpo,
    });

    return this.extrairId(resposta);
  }

  private async extrairId(resposta: Response): Promise<string> {
    const dados = (await resposta.json()) as { id: string };

    return dados.id;
  }

  private async requisitar(url: string, init: RequestInit = {}): Promise<Response> {
    const token = await this.googleAuth.obterAccessToken();

    const resposta = await fetch(url, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text();

      throw new Error(`Erro na API do Google Drive (${resposta.status}): ${detalhe}`);
    }

    return resposta;
  }
}
