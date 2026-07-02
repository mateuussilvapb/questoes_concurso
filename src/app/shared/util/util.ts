import { AutoComplete } from 'primeng/autocomplete';
import { MultiSelect } from 'primeng/multiselect';

export class Util {
  static forcarAberturaAutocompleteMultiselect(ac: AutoComplete | MultiSelect) {
    queueMicrotask(() => {
      ac.show();
    });
  }

  static forcarFechamentoAutocompleteMultiselect(ac: AutoComplete | MultiSelect) {
    queueMicrotask(() => {
      ac.hide();
    });
  }
}
