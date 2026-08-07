//Angular
import { Component, input } from '@angular/core';

//Externo
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-grafico-card',
  imports: [
    //Externo
    CardModule,
  ],
  templateUrl: './grafico-card.html',
})
export class GraficoCard {
  titulo = input.required<string>();
  subtitulo = input<string>();
  icone = input<string>();
  vazio = input<boolean>(false);
  mensagemVazio = input<string>('Sem dados para exibir com o filtro atual.');
}
