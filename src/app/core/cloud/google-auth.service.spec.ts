//Angular
import { TestBed } from '@angular/core/testing';

//Aplicação
import { GoogleAuthService } from './google-auth.service';

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;
  let requestAccessTokenMock: ReturnType<typeof vi.fn>;
  let revokeMock: ReturnType<typeof vi.fn>;
  let respostaSimulada: GoogleTokenResponse;

  beforeEach(() => {
    respostaSimulada = { access_token: 'token-abc', expires_in: 3600 };

    requestAccessTokenMock = vi.fn(() => {
      tokenClientMock.callback(respostaSimulada);
    });
    revokeMock = vi.fn();

    const tokenClientMock: GoogleTokenClient = {
      callback: () => {},
      requestAccessToken: requestAccessTokenMock as GoogleTokenClient['requestAccessToken'],
    };

    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: vi.fn(() => tokenClientMock),
          revoke: revokeMock as NonNullable<Window['google']>['accounts']['oauth2']['revoke'],
        },
      },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ email: 'fulano@gmail.com' }),
        } as Response),
      ),
    );

    TestBed.configureTestingModule({
      providers: [GoogleAuthService],
    });

    service = TestBed.inject(GoogleAuthService);
  });

  afterEach(() => {
    delete window.google;
    vi.unstubAllGlobals();
  });

  it('começa desautenticado, sem conta conectada', () => {
    expect(service.estaAutenticado()).toBe(false);
    expect(service.contaConectada()).toBeNull();
  });

  it('autentica e carrega a conta conectada após signIn()', async () => {
    await service.signIn();

    expect(service.estaAutenticado()).toBe(true);
    expect(service.contaConectada()).toBe('fulano@gmail.com');
    expect(requestAccessTokenMock).toHaveBeenCalledWith({ prompt: 'consent' });
  });

  it('rejeita quando o Google retorna erro no token', async () => {
    respostaSimulada = { access_token: '', expires_in: 0, error: 'access_denied' };

    await expect(service.signIn()).rejects.toThrow();
    expect(service.estaAutenticado()).toBe(false);
  });

  it('revoga o token e limpa a conta conectada em signOut()', async () => {
    await service.signIn();
    await service.signOut();

    expect(revokeMock).toHaveBeenCalledWith('token-abc');
    expect(service.estaAutenticado()).toBe(false);
    expect(service.contaConectada()).toBeNull();
  });

  it('reaproveita o token em cache em obterAccessToken() enquanto válido', async () => {
    await service.signIn();

    const token = await service.obterAccessToken();

    expect(token).toBe('token-abc');
    // Só a chamada de signIn() (prompt "consent") pediu token; a segunda leitura usou o cache.
    expect(requestAccessTokenMock).toHaveBeenCalledTimes(1);
  });

  it('renova silenciosamente quando o token em cache expirou', async () => {
    await service.signIn();

    // Força expiração simulando a passagem do tempo.
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 2 * 3600 * 1000);

    respostaSimulada = { access_token: 'token-renovado', expires_in: 3600 };
    const token = await service.obterAccessToken();

    expect(token).toBe('token-renovado');
    expect(requestAccessTokenMock).toHaveBeenLastCalledWith({ prompt: '' });
  });
});
