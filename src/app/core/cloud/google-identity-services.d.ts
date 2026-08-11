/**
 * Tipos mínimos da API pública do Google Identity Services (GIS) usada por
 * GoogleAuthService — apenas o "Token Client" para obter access tokens de
 * OAuth 2.0 no navegador. Não existe pacote @types oficial para isso.
 * Referência: https://developers.google.com/identity/oauth2/web/reference/js-reference
 */
interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (resposta: GoogleTokenResponse) => void;
}

interface GoogleTokenClient {
  callback: (resposta: GoogleTokenResponse) => void;
  requestAccessToken(overrideConfig?: { prompt?: string }): void;
}

interface Window {
  google?: {
    accounts: {
      oauth2: {
        initTokenClient(config: GoogleTokenClientConfig): GoogleTokenClient;
        revoke(accessToken: string, done?: () => void): void;
      };
    };
  };
}
