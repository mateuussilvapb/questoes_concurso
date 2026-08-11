//Angular
import { Injectable, signal } from '@angular/core';

const CHAVE_CONTA_ATUAL = 'questoes-concurso.sync.contaAtual';

/**
 * Estado local de sincronização com a nuvem (§2.3 do plano de backup em
 * nuvem). `revisaoSincronizada` é chaveada por conta Google porque contas
 * diferentes apontam para Drives diferentes, com sequências de revisão
 * independentes — comparar os números entre contas produziria uma decisão
 * de restauração errada.
 */
@Injectable({
  providedIn: 'root',
})
export class SyncStateService {
  private readonly contaAtualSignal = signal<string | null>(
    localStorage.getItem(CHAVE_CONTA_ATUAL),
  );

  readonly contaAtual = this.contaAtualSignal.asReadonly();

  definirContaAtual(conta: string | null): void {
    if (conta) {
      localStorage.setItem(CHAVE_CONTA_ATUAL, conta);
    } else {
      localStorage.removeItem(CHAVE_CONTA_ATUAL);
    }

    this.contaAtualSignal.set(conta);
  }

  obterRevisaoSincronizada(conta: string): number {
    const valor = localStorage.getItem(this.chaveRevisao(conta));

    return valor ? Number(valor) : 0;
  }

  definirRevisaoSincronizada(conta: string, revisao: number): void {
    localStorage.setItem(this.chaveRevisao(conta), String(revisao));
  }

  private chaveRevisao(conta: string): string {
    return `questoes-concurso.sync.${this.hashConta(conta)}.revisaoSincronizada`;
  }

  /**
   * Hash simples (djb2) só para compor uma chave curta e estável por conta —
   * não é criptográfico, o e-mail já vive em texto claro em `contaAtual`.
   */
  private hashConta(conta: string): string {
    let hash = 5381;

    for (let i = 0; i < conta.length; i++) {
      hash = (hash * 33) ^ conta.charCodeAt(i);
    }

    return (hash >>> 0).toString(16);
  }
}
