//Aplicação
import { GranularidadeTemporal } from '../enums/granularidade-temporal.enum';

const MESES_ABREVIADOS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

/**
 * Todas as datas são tratadas por componentes LOCAIS (getFullYear/getMonth/getDate).
 * Nunca usar toISOString() aqui: em UTC-3 ele devolve o dia errado depois das 21h.
 */
export class DataEstatistica {
  static inicioDoDia(data: Date): Date {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate(), 0, 0, 0, 0);
  }

  static fimDoDia(data: Date): Date {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate(), 23, 59, 59, 999);
  }

  static chaveDia(data: Date): string {
    const y = data.getFullYear();
    const m = String(data.getMonth() + 1).padStart(2, '0');
    const d = String(data.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
  }

  static deChaveDia(chave: string): Date {
    const [y, m, d] = chave.split('-').map(Number);

    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  /** Segunda-feira da semana da data informada, início do dia. */
  static inicioDaSemana(data: Date): Date {
    const inicioDia = this.inicioDoDia(data);
    const diaSemana = inicioDia.getDay(); // 0=domingo..6=sábado
    const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;

    inicioDia.setDate(inicioDia.getDate() + deslocamento);

    return inicioDia;
  }

  static chaveMes(data: Date): string {
    const y = data.getFullYear();
    const m = String(data.getMonth() + 1).padStart(2, '0');

    return `${y}-${m}`;
  }

  static inicioBucket(data: Date, granularidade: GranularidadeTemporal): Date {
    switch (granularidade) {
      case GranularidadeTemporal.SEMANA:
        return this.inicioDaSemana(data);
      case GranularidadeTemporal.MES:
        return new Date(data.getFullYear(), data.getMonth(), 1, 0, 0, 0, 0);
      case GranularidadeTemporal.DIA:
      default:
        return this.inicioDoDia(data);
    }
  }

  static chaveBucket(data: Date, granularidade: GranularidadeTemporal): string {
    if (granularidade === GranularidadeTemporal.MES) {
      return this.chaveMes(data);
    }

    return this.chaveDia(this.inicioBucket(data, granularidade));
  }

  /** Devolve o início do bucket seguinte ao informado. */
  static avancarBucket(inicioBucketAtual: Date, granularidade: GranularidadeTemporal): Date {
    const proximo = new Date(inicioBucketAtual);

    switch (granularidade) {
      case GranularidadeTemporal.SEMANA:
        proximo.setDate(proximo.getDate() + 7);
        break;
      case GranularidadeTemporal.MES:
        proximo.setMonth(proximo.getMonth() + 1);
        break;
      case GranularidadeTemporal.DIA:
      default:
        proximo.setDate(proximo.getDate() + 1);
        break;
    }

    return proximo;
  }

  static formatarLabel(inicioBucket: Date, granularidade: GranularidadeTemporal): string {
    const dd = (data: Date) => String(data.getDate()).padStart(2, '0');
    const mm = (data: Date) => String(data.getMonth() + 1).padStart(2, '0');

    if (granularidade === GranularidadeTemporal.MES) {
      const mesAbrev = MESES_ABREVIADOS[inicioBucket.getMonth()];
      const anoCurto = String(inicioBucket.getFullYear()).slice(-2);

      return `${mesAbrev}/${anoCurto}`;
    }

    if (granularidade === GranularidadeTemporal.SEMANA) {
      const fim = new Date(inicioBucket);
      fim.setDate(fim.getDate() + 6);

      return `${dd(inicioBucket)}/${mm(inicioBucket)} a ${dd(fim)}/${mm(fim)}`;
    }

    return `${dd(inicioBucket)}/${mm(inicioBucket)}`;
  }

  /** Diferença em dias inteiros entre dois timestamps, imune a DST (usa Date.UTC das partes locais). */
  static diasEntre(msA: number, msB: number): number {
    const a = new Date(msA);
    const b = new Date(msB);

    const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.round((utcB - utcA) / 86_400_000);
  }
}
