import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AutoComplete } from 'primeng/autocomplete';
import { MultiSelect } from 'primeng/multiselect';

export interface SelectOption<T> {
  value: T;
  label: string;
}

export class Util {
  private static readonly LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  /**
   * Força a abertura de um autocomplete ou multiselect.
   *
   * @param ac O autocomplete ou Multiselect que será aberto
   */
  static forcarAberturaAutocompleteMultiselect(ac: AutoComplete | MultiSelect) {
    queueMicrotask(() => {
      ac.show();
    });
  }

  /**
   * Força o fechamento de um autocomplete ou multiselect.
   *
   * @param ac O autocomplete ou Multiselect que será fechado
   */
  static forcarFechamentoAutocompleteMultiselect(ac: AutoComplete | MultiSelect) {
    queueMicrotask(() => {
      ac.hide();
    });
  }

  /**
   * Transforma um Enum numérico e seu Record de Labels em um array de opções para Select/Dropdown.
   *
   * @param enumObject O Enum numérico do TypeScript (ex: NivelDificuldade)
   * @param labelRecord O Record contendo as labels (ex: NivelDificuldadeLabel)
   */
  static mapearEnumParaOpcoes<T extends number>(
    enumObject: any,
    labelRecord: Record<any, string>,
  ): SelectOption<T>[] {
    return Object.keys(enumObject)
      .filter((key) => !Number.isNaN(Number(key)))
      .map((key) => {
        const valorEnum = Number(key) as T;
        return {
          value: valorEnum,
          label: labelRecord[valorEnum] || `Opção ${key}`,
        };
      });
  }

  /**
   * Método utilitário para converter um texto em HTML para texto puro, removendo tags e espaços extras.
   *
   * @param html O texto em html
   * @returns Texto sem tags HTML
   */
  static htmlToText(html: string | null | undefined): string {
    if (!html) {
      return '';
    }

    const div = document.createElement('div');
    div.innerHTML = html;

    return (div.textContent || div.innerText || '')
      .replaceAll('\u00A0', ' ')
      .replaceAll(/\s+/g, ' ')
      .trim();
  }

  /**
   * Método para ordenar aleatoriamente arrays
   *
   * @param array O array de itens para ordenação
   * @returns Array ordenado aleatoriamente
   */
  static shuffle<T>(items: readonly T[]): T[] {
    const array = [...items];

    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
  }

  /**
   * Método de bypass de sanitização do html afim de manter exatamente o mesmo conteúdo
   */
  static bypassSanitizerHtml(text: string, sanitizer: DomSanitizer): SafeHtml {
    const html = text.replaceAll('&nbsp;', ' ').replaceAll('\u00A0', ' ');

    return sanitizer.bypassSecurityTrustHtml(html);
  }

  /**
   * Método para mapeamento de índice para letra.
   * Caso 'index' == 0, retorna letra 'A'.
   * Caso 'index' == 1, retorna letra 'B'.
   * etc
   *
   * @param index índice de um array
   * @returns Letra correspondente ao índice
   */
  static mapIndexToLetter(index: number): string {
    return this.LETTERS[index] || '';
  }

  /**
   * Formata uma quantidade de segundos como 'mm:ss'.
   *
   * @param segundos Quantidade de segundos
   */
  static formatarDuracao(segundos: number): string {
    const total = Math.max(0, Math.round(segundos ?? 0));
    const minutos = Math.floor(total / 60);
    const segs = total % 60;

    return `${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
  }
}
