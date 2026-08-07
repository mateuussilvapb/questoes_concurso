//Angular
import { Component, computed, input, output } from '@angular/core';

//Externo
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-estatistica-vazia',
  imports: [
    //Externo
    ButtonModule,
  ],
  templateUrl: './estatistica-vazia.html',
})
export class EstatisticaVazia {
  modo = input.required<'sem-historico' | 'sem-resultado'>();

  acaoClick = output();

  protected readonly icone = computed(() =>
    this.modo() === 'sem-historico' ? 'pi pi-chart-bar' : 'pi pi-filter-slash',
  );

  protected readonly titulo = computed(() =>
    this.modo() === 'sem-historico'
      ? 'Você ainda não respondeu nenhuma questão'
      : 'Nenhum resultado para o filtro atual',
  );

  protected readonly descricao = computed(() =>
    this.modo() === 'sem-historico'
      ? 'Resolva questões para começar a acompanhar sua evolução aqui.'
      : 'Ajuste os filtros para ver os dados do seu histórico.',
  );

  protected readonly labelBotao = computed(() =>
    this.modo() === 'sem-historico' ? 'Resolver questões' : 'Limpar filtros',
  );
}
