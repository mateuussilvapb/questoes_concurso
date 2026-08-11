//Angular
import { Component, computed, inject, input } from '@angular/core';

//Aplicação
import { ThemeService } from '../../../core/services/theme.service';

//Externo
import { CardModule } from 'primeng/card';

export type AcentoKpi = 'marca' | 'sucesso' | 'perigo' | 'alerta' | 'info';

const CLASSES_ACENTO_LIGHT: Record<AcentoKpi, string> = {
  marca: 'bg-indigo-100 text-indigo-700',
  sucesso: 'bg-green-100 text-green-700',
  perigo: 'bg-red-100 text-red-700',
  alerta: 'bg-yellow-100 text-yellow-700',
  info: 'bg-blue-100 text-blue-700',
};

const CLASSES_ACENTO_DARK: Record<AcentoKpi, string> = {
  marca: 'bg-indigo-900 text-indigo-200',
  sucesso: 'bg-green-900 text-green-200',
  perigo: 'bg-red-900 text-red-200',
  alerta: 'bg-yellow-900 text-yellow-200',
  info: 'bg-blue-900 text-blue-200',
};

/**
 * Card de indicador (KPI) padronizado da aplicação.
 *
 * A cor entra como acento no ícone, mantendo a superfície neutra do `p-card`.
 * Isso mantém os cards visualmente irmãos entre si e coerentes com os cards
 * de gráfico, evitando blocos de cor chapada competindo na mesma tela.
 */
@Component({
  selector: 'app-kpi-card',
  imports: [
    //Externo
    CardModule,
  ],
  templateUrl: './kpi-card.html',
})
export class KpiCard {
  private readonly themeService = inject(ThemeService);

  titulo = input.required<string>();
  valor = input.required<string>();
  icone = input.required<string>();
  acento = input<AcentoKpi>('marca');
  descricao = input<string>();

  protected readonly classesIcone = computed(() =>
    this.themeService.isDarkMode()
      ? CLASSES_ACENTO_DARK[this.acento()]
      : CLASSES_ACENTO_LIGHT[this.acento()],
  );
}
