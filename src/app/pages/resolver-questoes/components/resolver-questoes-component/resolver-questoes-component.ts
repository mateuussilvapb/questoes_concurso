//Angular
import { Component, computed, inject, input, output, signal } from '@angular/core';

//Aplicação
import { ResolverQuestoes } from '../../core/models/resolver-questoes.model';
import { Questao } from '../../../questoes/core/models/questao.model';
import { TimerService } from './../../../../core/timer/service/timer.service';
import { LayoutService } from './../../../../core/services/layout.service';
import { ResolverQuestaoCard } from '../resolver-questao-card/resolver-questao-card';
import { ResultadosResolucao } from '../resolver-questoes-page/resolver-questoes-page';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';
import {
  DialogEncerrarResolucao,
  EncerrarResolucaoOpcao,
} from '../dialog-encerrar-resolucao/dialog-encerrar-resolucao';

//Externo
import { DialogService } from 'primeng/dynamicdialog';
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
  private readonly dialogService = inject(DialogService);
  private readonly layoutService = inject(LayoutService);

  questoes = input.required<ResolverQuestoes[]>();

  encerrar = output<{ persistir: boolean }>();
  finalizar = output<ResultadosResolucao>();
  respondeu = output<{
    questaoId: string;
    alternativaId: string;
    correta: boolean;
    tempoResposta: number;
    respondidaEm: string;
  }>();
  questaoAtualizada = output<Questao>();
  comentarioAtualizado = output<Questao>();

  readonly indiceAtual = signal<number>(0);

  private inicioQuestaoAtual = Date.now();

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
    this.timerService.hide();
  }

  private alterarIndice(indice: number) {
    if (indice < 0 || indice >= this.questoes().length) {
      return;
    }

    this.indiceAtual.set(indice);
    this.inicioQuestaoAtual = Date.now();
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
    if (this.totalQuestoesResolvidas() === 0) {
      this.encerrar.emit({ persistir: false });
      this.timerService.stop();
      return;
    }

    this.confirmarEncerrar();
  }

  confirmarEncerrar() {
    const ref = this.dialogService.open(DialogEncerrarResolucao, {
      header: 'Encerrar resolução',
      width: this.layoutService.isMobile() ? '100vw' : '40vw',
      closeOnEscape: true,
      draggable: false,
      closable: true,
      maximizable: this.layoutService.isMobile(),
    });

    ref?.onClose.subscribe((opcao?: EncerrarResolucaoOpcao) => {
      if (!opcao || opcao === 'continuar') {
        return;
      }

      this.encerrar.emit({ persistir: opcao === 'persistir' });
      this.timerService.stop();
    });
  }

  onRespondeu(event: { alternativaId: string; correta: boolean }) {
    const tempoResposta = Math.round((Date.now() - this.inicioQuestaoAtual) / 1000);

    this.respondeu.emit({
      questaoId: this.questaoAtual().questao.id,
      alternativaId: event.alternativaId,
      correta: event.correta,
      tempoResposta,
      respondidaEm: new Date().toISOString(),
    });
  }

  onQuestaoEditada(questao: Questao) {
    this.inicioQuestaoAtual = Date.now();
    this.questaoAtualizada.emit(questao);
  }

  onComentarioAtualizado(questao: Questao) {
    this.comentarioAtualizado.emit(questao);
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
