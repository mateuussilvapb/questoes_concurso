//Angular
import { Component, computed, inject, input, output, signal } from '@angular/core';

//Aplicação
import { ResolverQuestoes } from '../../core/models/resolver-questoes.model';
import { TimerService } from './../../../../core/timer/service/timer.service';
import { ResolverQuestaoCard } from '../resolver-questao-card/resolver-questao-card';
import { ResultadosResolucao } from '../resolver-questoes-page/resolver-questoes-page';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';

//Externo
import { ConfirmationService } from 'primeng/api';
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
  private readonly timerService = inject(TimerService);
  private readonly confirmationService = inject(ConfirmationService);

  questoes = input.required<ResolverQuestoes[]>();

  encerrar = output();
  finalizar = output<ResultadosResolucao>();
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

  constructor() {
    this.timerService.startStopwatchDisabled();
  }

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
      this.timerService.stop();
    } else {
      this.confirmarEncerrar();
    }
  }

  confirmarEncerrar() {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja encerrar? Os resultados não serão persistidos no histórico.',
      header: 'Confirma?',
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Continuar',
      rejectButtonStyleClass: 'p-button-primary',
      acceptLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.encerrar.emit();
        this.timerService.stop();
      },
    });
  }

  onRespondeu(event: { alternativaId: string; correta: boolean }) {
    this.respondeu.emit({
      questaoId: this.questaoAtual().questao.id,
      alternativaId: event.alternativaId,
      correta: event.correta,
    });
  }

  onFinalizarRespostas() {
    const tempoGasto = this.timerService.state().elapsedSeconds;
    this.finalizar.emit({
      totalQuestoesResolvidas: this.totalQuestoesResolvidas(),
      totalQuestoesCorretas: this.totalQuestoesCorretas(),
      totalQuestoesIncorretas: this.totalQuestoesIncorretas(),
      tempoGasto: tempoGasto,
    });
    this.timerService.stop();
  }
}
