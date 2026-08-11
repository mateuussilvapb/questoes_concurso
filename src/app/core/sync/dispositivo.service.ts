//Angular
import { Injectable, inject, signal } from '@angular/core';

//Aplicação
import { IdGeneratorService } from '../storage/id-generator/id-generator.service';

const CHAVE_DISPOSITIVO_ID = 'questoes-concurso.sync.dispositivoId';
const CHAVE_DISPOSITIVO_NOME = 'questoes-concurso.sync.dispositivoNome';
const NOME_PADRAO = 'Meu dispositivo';

/**
 * Identidade do dispositivo, usada para atribuir autoria a uma revisão de
 * backup enviada à nuvem (Fase 2). O id é global (não muda ao trocar de
 * conta Google) e gerado uma única vez.
 */
@Injectable({
  providedIn: 'root',
})
export class DispositivoService {
  private readonly idGenerator = inject(IdGeneratorService);

  private readonly nomeSignal = signal<string>(this.getNomeInicial());

  readonly nome = this.nomeSignal.asReadonly();

  obterId(): string {
    const existente = localStorage.getItem(CHAVE_DISPOSITIVO_ID);

    if (existente) return existente;

    const novoId = this.idGenerator.generate();
    localStorage.setItem(CHAVE_DISPOSITIVO_ID, novoId);

    return novoId;
  }

  renomear(nome: string): void {
    const nomeSanitizado = nome.trim() || NOME_PADRAO;

    localStorage.setItem(CHAVE_DISPOSITIVO_NOME, nomeSanitizado);
    this.nomeSignal.set(nomeSanitizado);
  }

  private getNomeInicial(): string {
    return localStorage.getItem(CHAVE_DISPOSITIVO_NOME) ?? NOME_PADRAO;
  }
}
