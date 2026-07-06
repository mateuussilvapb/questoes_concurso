import { ConfirmationService } from 'primeng/api';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { ResolverQuestoes } from '../../core/models/resolver-questoes.model';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';
import { ResolverQuestaoCard } from '../resolver-questao-card/resolver-questao-card';

@Component({
  selector: 'app-resolver-questoes-component',
  imports: [
    //Aplicação
    LayoutBasePages,
    ResolverQuestaoCard,
  ],
  templateUrl: './resolver-questoes-component.html',
})
export class ResolverQuestoesComponent {
  private readonly confirmationService = inject(ConfirmationService);

  questoes = input.required<ResolverQuestoes[]>();

  encerrar = output();
  finalizar = output();
  respondeu = output<{ questaoId: string; alternativaId: string; correta: boolean }>();

  readonly indiceAtual = signal<number>(0);

  readonly questaoAtual = computed(() => this.questoes()[this.indiceAtual()]);

  readonly totalQuestoesResolvidas = computed(
    () => this.questoes().filter((q) => q.resolvida).length,
  );
  readonly totalQuestoesRestantes = computed(
    () => this.questoes().length - this.totalQuestoesResolvidas(),
  );
  readonly totalQuestoesCorretas = computed(
    () => this.questoes().filter((q) => q.resolvida && q.correta).length,
  );
  readonly totalQuestoesIncorretas = computed(
    () => this.questoes().filter((q) => q.resolvida && !q.correta).length,
  );
  readonly finalizado = computed(() => this.totalQuestoesResolvidas() == this.questoes().length);

  readonly title = computed(() => `Questão ${this.indiceAtual() + 1} de ${this.questoes().length}`);
  readonly textQuestoesResolvidas = computed(() => `${this.totalQuestoesResolvidas()} resolvidas`);
  readonly textQuestoesRestantes = computed(() => `${this.totalQuestoesRestantes()} restantes`);

  readonly primeiraQuestao = computed(() => this.indiceAtual() === 0);
  readonly ultimaQuestao = computed(() => this.indiceAtual() === this.questoes().length - 1);

  readonly podeAvancar = computed(() => !this.ultimaQuestao());
  readonly podeVoltar = computed(() => !this.primeiraQuestao());
  readonly podeEncerrar = computed(() => this.totalQuestoesResolvidas() == this.questoes().length);

  private alterarIndice(indice: number) {
    if (indice < 0 || indice >= this.questoes().length) {
      return;
    }

    this.indiceAtual.set(indice);
  }

  proximaQuestao() {
    this.alterarIndice(this.indiceAtual() + 1);
  }

  questaoAnterior() {
    this.alterarIndice(this.indiceAtual() - 1);
  }

  irParaQuestao(indice: number) {
    this.alterarIndice(indice);
  }

  onEncerrar() {
    if (this.podeEncerrar()) {
      this.encerrar.emit();
    } else {
      this.confirmarEncerrar();
    }
  }

  confirmarEncerrar() {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja encerrar? Os resultados não serão persistidos no histórico.',
      header: 'Confirma?',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.encerrar.emit(),
    });
  }

  onRespondeu(event: { alternativaId: string; correta: boolean }) {
    this.respondeu.emit({
      questaoId: this.questaoAtual().questao.id,
      alternativaId: event.alternativaId,
      correta: event.correta,
    });
  }
}
