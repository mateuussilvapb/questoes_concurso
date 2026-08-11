//Angular
import { PercentPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

//Aplicação
import { Util } from '../../../../shared/util/util';
import { EstatisticasResumo } from '../../core/models/estatisticas-resumo.model';
import { AcentoKpi, KpiCard } from '../../../../shared/components/kpi-card/kpi-card';

interface CardKpi {
  titleCard: string;
  textCard: string;
  icon: string;
  acento: AcentoKpi;
}

@Component({
  selector: 'app-estatistica-kpi-cards',
  imports: [
    //Aplicação
    KpiCard,
  ],
  templateUrl: './estatistica-kpi-cards.html',
})
export class EstatisticaKpiCards {
  resumo = input.required<EstatisticasResumo>();

  cards = computed<CardKpi[]>(() => {
    const resumo = this.resumo();
    const aproveitamento =
      resumo.aproveitamento === null
        ? '-'
        : new PercentPipe('pt-BR').transform(resumo.aproveitamento, '1.2-2');

    return [
      {
        titleCard: 'Questões Respondidas',
        textCard: String(resumo.totalRespondidas),
        icon: 'pi pi-file',
        acento: 'marca',
      },
      {
        titleCard: 'Aproveitamento',
        textCard: String(aproveitamento),
        icon: 'pi pi-chart-pie',
        acento: 'info',
      },
      {
        titleCard: 'Tempo Médio por Questão',
        textCard:
          resumo.tempoMedioResposta === null
            ? '-'
            : Util.formatarDuracao(resumo.tempoMedioResposta),
        icon: 'pi pi-clock',
        acento: 'alerta',
      },
      {
        titleCard: 'Dias Estudados',
        textCard: String(resumo.diasEstudados),
        icon: 'pi pi-calendar',
        acento: 'sucesso',
      },
      {
        titleCard: 'Sequência Atual',
        textCard: `${resumo.sequenciaAtualDias} dia(s)`,
        icon: 'pi pi-bolt',
        acento: 'alerta',
      },
      {
        titleCard: 'Sequência Recorde',
        textCard: `${resumo.sequenciaRecordeDias} dia(s)`,
        icon: 'pi pi-star',
        acento: 'perigo',
      },
    ];
  });
}
