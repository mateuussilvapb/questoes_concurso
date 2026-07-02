import { AutoComplete } from 'primeng/autocomplete';
import { MultiSelect } from 'primeng/multiselect';

export interface SelectOption<T> {
  value: T;
  label: string;
}

export class Util {
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
   * @returns
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
}
