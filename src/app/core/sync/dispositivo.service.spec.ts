//Angular
import { TestBed } from '@angular/core/testing';

//Aplicação
import { DispositivoService } from './dispositivo.service';

describe('DispositivoService', () => {
  let service: DispositivoService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [DispositivoService],
    });

    service = TestBed.inject(DispositivoService);
  });

  it('gera um id na primeira chamada e o persiste para as seguintes', () => {
    const id = service.obterId();

    expect(id).toBeTruthy();
    expect(service.obterId()).toBe(id);
    expect(localStorage.getItem('questoes-concurso.sync.dispositivoId')).toBe(id);
  });

  it('reaproveita o id já salvo em localStorage, sem gerar um novo', () => {
    localStorage.setItem('questoes-concurso.sync.dispositivoId', 'id-existente');

    expect(service.obterId()).toBe('id-existente');
  });

  it('usa um nome padrão quando não há nome salvo', () => {
    expect(service.nome()).toBe('Meu dispositivo');
  });

  it('renomeia o dispositivo e persiste o novo nome', () => {
    service.renomear('Notebook');

    expect(service.nome()).toBe('Notebook');
    expect(localStorage.getItem('questoes-concurso.sync.dispositivoNome')).toBe('Notebook');
  });

  it('ignora nome em branco e mantém o nome padrão', () => {
    service.renomear('   ');

    expect(service.nome()).toBe('Meu dispositivo');
  });
});
