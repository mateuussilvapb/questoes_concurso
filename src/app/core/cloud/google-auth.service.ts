//Angular
import { Injectable, signal } from '@angular/core';

//Aplicação
import { environment } from '../../../environments/environment';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

/**
 * Escopos não-sensíveis (§2.4 do plano): `drive.file` só enxerga arquivos
 * criados pelo próprio app; `openid`/`email`/`profile` só identificam a
 * conta conectada.
 */
const ESCOPOS = 'https://www.googleapis.com/auth/drive.file openid email profile';

/**
 * Sem sessão Google ativa, requestAccessToken({ prompt: '' }) pode nunca
 * chamar o callback (nem sucesso, nem erro) em vez de falhar rápido — por
 * isso a renovação silenciosa precisa de um timeout próprio (§6.1 do plano:
 * o fallback manual depende de detectar essa ausência de sessão sem travar).
 */
const TIMEOUT_RENOVACAO_SILENCIOSA_MS = 4000;

interface TokenCache {
  accessToken: string;
  expiraEm: number;
}

/**
 * Autenticação com o Google via Identity Services (token client), sem
 * backend. O token de acesso é mantido só em memória — nunca em
 * localStorage — e vale por ~1h (§6.1 do plano: não há refresh token em
 * OAuth puro de navegador).
 */
@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private readonly contaConectadaSignal = signal<string | null>(null);

  readonly contaConectada = this.contaConectadaSignal.asReadonly();

  private tokenClient: GoogleTokenClient | null = null;
  private tokenCache: TokenCache | null = null;
  private scriptCarregado: Promise<void> | null = null;

  estaAutenticado(): boolean {
    return this.tokenValido();
  }

  async signIn(): Promise<void> {
    await this.carregarScript();
    await this.solicitarToken('consent');
    await this.carregarConta();
  }

  async signOut(): Promise<void> {
    if (this.tokenCache) {
      window.google?.accounts.oauth2.revoke(this.tokenCache.accessToken);
    }

    this.tokenCache = null;
    this.contaConectadaSignal.set(null);
  }

  /**
   * Retorna um access token válido, renovando silenciosamente (sem popup de
   * consentimento) se o cache tiver expirado. Lança se a renovação
   * silenciosa falhar — chamado precisa oferecer signIn() como fallback.
   */
  async obterAccessToken(): Promise<string> {
    if (this.tokenValido()) {
      return this.tokenCache!.accessToken;
    }

    await this.carregarScript();
    await this.comTimeout(
      this.solicitarToken(''),
      TIMEOUT_RENOVACAO_SILENCIOSA_MS,
      'Renovação silenciosa do acesso ao Google Drive expirou.',
    );

    if (!this.tokenValido()) {
      throw new Error('Não foi possível renovar o acesso ao Google Drive. Conecte-se novamente.');
    }

    if (!this.contaConectadaSignal()) {
      await this.carregarConta();
    }

    return this.tokenCache!.accessToken;
  }

  private comTimeout<T>(promessa: Promise<T>, ms: number, mensagem: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const temporizador = setTimeout(() => reject(new Error(mensagem)), ms);

      promessa.then(
        (valor) => {
          clearTimeout(temporizador);
          resolve(valor);
        },
        (erro) => {
          clearTimeout(temporizador);
          reject(erro);
        },
      );
    });
  }

  private tokenValido(): boolean {
    return !!this.tokenCache && this.tokenCache.expiraEm > Date.now();
  }

  private carregarScript(): Promise<void> {
    if (this.scriptCarregado) return this.scriptCarregado;

    this.scriptCarregado = new Promise((resolve, reject) => {
      if (window.google || document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');

      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Não foi possível carregar o Google Identity Services.'));

      document.head.appendChild(script);
    });

    return this.scriptCarregado;
  }

  private solicitarToken(prompt: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.google) {
        reject(new Error('Google Identity Services indisponível.'));
        return;
      }

      if (!this.tokenClient) {
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: environment.google.clientId,
          scope: ESCOPOS,
          callback: () => {},
        });
      }

      this.tokenClient.callback = (resposta) => {
        if (resposta.error) {
          reject(new Error(resposta.error_description ?? resposta.error));
          return;
        }

        this.tokenCache = {
          accessToken: resposta.access_token,
          expiraEm: Date.now() + resposta.expires_in * 1000,
        };

        resolve();
      };

      this.tokenClient.requestAccessToken({ prompt });
    });
  }

  private async carregarConta(): Promise<void> {
    if (!this.tokenCache) return;

    const resposta = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${this.tokenCache.accessToken}` },
    });

    if (!resposta.ok) return;

    const dados = (await resposta.json()) as { email?: string };

    this.contaConectadaSignal.set(dados.email ?? null);
  }
}
