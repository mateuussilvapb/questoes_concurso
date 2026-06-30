import { AutoComplete } from 'primeng/autocomplete';

export class Util {
  static forcarAberturaAutocomplete(ac: AutoComplete) {
    queueMicrotask(() => {
      ac.show();
    });
  }

  static forcarFechamentoAutocomplete(ac: AutoComplete) {
    queueMicrotask(() => {
      ac.hide();
    });
  }
}
