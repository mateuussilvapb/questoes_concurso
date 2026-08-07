//Angular
import { PercentPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';

//Aplicação
import { ThemeService } from '../../../../core/services/theme.service';
import { Util } from '../../../../shared/util/util';
import { EstatisticasResumo } from '../../core/models/estatisticas-resumo.model';

//Externo
import { CardModule } from 'primeng/card';

interface CardKpi {
  titleCard: string;
  textCard: string;
  textColorCard: string;
  backGroundColorCard: string;
  icon: string;
}

@Component({
  selector: 'app-estatistica-kpi-cards',
  imports: [
    //Externo
    CardModule,
  ],
  templateUrl: './estatistica-kpi-cards.html',
})
export class EstatisticaKpiCards {
  protected readonly themeService = inject(ThemeService);

  resumo = input.required<EstatisticasResumo>();

  cards = computed<CardKpi[]>(() => {
    const resumo = this.resumo();
    const isDarkMode = this.themeService.isDarkMode();
    const aproveitamento =
      resumo.aproveitamento === null
        ? '-'
        : new PercentPipe('pt-BR').transform(resumo.aproveitamento, '1.2-2');

    return [
      {
        titleCard: 'Questões Respondidas',
        textCard: String(resumo.totalRespondidas),
        backGroundColorCard: '',
        textColorCard: '',
        icon: 'pi pi-file',
      },
      {
        titleCard: 'Aproveitamento',
        textCard: String(aproveitamento),
        backGroundColorCard: isDarkMode ? 'bg-blue-900' : 'bg-blue-300',
        textColorCard: isDarkMode ? 'text-blue-300' : 'text-blue-900',
        icon: 'pi pi-chart-pie',
      },
      {
        titleCard: 'Tempo Médio por Questão',
        textCard:
          resumo.tempoMedioResposta === null
            ? '-'
            : Util.formatarDuracao(resumo.tempoMedioResposta),
        backGroundColorCard: isDarkMode ? 'bg-yellow-900' : 'bg-yellow-300',
        textColorCard: isDarkMode ? 'text-yellow-300' : 'text-yellow-900',
        icon: 'pi pi-clock',
      },
      {
        titleCard: 'Dias Estudados',
        textCard: String(resumo.diasEstudados),
        backGroundColorCard: isDarkMode ? 'bg-green-900' : 'bg-green-300',
        textColorCard: isDarkMode ? 'text-green-300' : 'text-green-900',
        icon: 'pi pi-calendar',
      },
      {
        titleCard: 'Sequência Atual',
        textCard: `${resumo.sequenciaAtualDias} dia(s)`,
        backGroundColorCard: isDarkMode ? 'bg-orange-900' : 'bg-orange-300',
        textColorCard: isDarkMode ? 'text-orange-300' : 'text-orange-900',
        icon: 'pi pi-bolt',
      },
      {
        titleCard: 'Sequência Recorde',
        textCard: `${resumo.sequenciaRecordeDias} dia(s)`,
        backGroundColorCard: isDarkMode ? 'bg-red-900' : 'bg-red-300',
        textColorCard: isDarkMode ? 'text-red-300' : 'text-red-900',
        icon: 'pi pi-star',
      },
    ];
  });
}
