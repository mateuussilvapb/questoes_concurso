//Angular
import { TestBed } from '@angular/core/testing';

//Aplicação
import { SyncStateService } from './sync-state.service';

describe('SyncStateService', () => {
  let service: SyncStateService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [SyncStateService],
    });

    service = TestBed.inject(SyncStateService);
  });

  it('não tem conta atual quando nada foi salvo', () => {
    expect(service.contaAtual()).toBeNull();
  });

  it('persiste e lê a conta atual', () => {
    service.definirContaAtual('fulano@gmail.com');

    expect(service.contaAtual()).toBe('fulano@gmail.com');
    expect(localStorage.getItem('questoes-concurso.sync.contaAtual')).toBe('fulano@gmail.com');
  });

  it('remove a conta atual ao desconectar', () => {
    service.definirContaAtual('fulano@gmail.com');
    service.definirContaAtual(null);

    expect(service.contaAtual()).toBeNull();
    expect(localStorage.getItem('questoes-concurso.sync.contaAtual')).toBeNull();
  });

  it('retorna 0 como revisão sincronizada quando nada foi salvo para a conta', () => {
    expect(service.obterRevisaoSincronizada('fulano@gmail.com')).toBe(0);
  });

  it('persiste a revisão sincronizada por conta, isoladamente', () => {
    service.definirRevisaoSincronizada('fulano@gmail.com', 7);
    service.definirRevisaoSincronizada('outra@gmail.com', 2);

    expect(service.obterRevisaoSincronizada('fulano@gmail.com')).toBe(7);
    expect(service.obterRevisaoSincronizada('outra@gmail.com')).toBe(2);
  });
});
