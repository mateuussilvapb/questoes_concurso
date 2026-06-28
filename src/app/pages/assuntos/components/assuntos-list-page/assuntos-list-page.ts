//Angular
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

//Externo
import { AutoComplete, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

//Aplicação
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';
import { ListBase } from '../../../../shared/components/list-base/list-base';
import { Materia } from '../../../materias/core/models/materia.model';
import { MateriaService } from '../../../materias/core/services/materia.service';
import { Questao } from '../../../questoes/core/models/questao.model';
import { QuestaoService } from '../../../questoes/core/services/questao.service';
import { Assunto } from '../../core/models/assunto.model';
import { AssuntoService } from '../../core/services/assunto.service';
import { AssuntoCardPresentation } from '../assunto-card-presentation/assunto-card-presentation';

@Component({
  selector: 'app-assuntos-list-page',
  imports: [
    //Angular
    FormsModule,
    //Aplicação
    LayoutBasePages,
    AssuntoCardPresentation,
    //Externo
    ButtonModule,
    InputIconModule,
    IconFieldModule,
    InputTextModule,
    AutoCompleteModule,
  ],
  templateUrl: './assuntos-list-page.html',
})
export class AssuntosListPage extends ListBase implements OnInit {
  private readonly materiaService = inject(MateriaService);
  private readonly assuntoService = inject(AssuntoService);
  private readonly questaoService = inject(QuestaoService);

  protected materiaSearch = signal<string>('');
  protected materias = signal<Materia[]>([]);
  protected materiasFiltradas = computed(() => {
    const busca = this.materiaSearch().toLowerCase().trim();
    const listaOriginal = this.materias();

    if (!busca) {
      return listaOriginal;
    }

    return listaOriginal.filter((materia) => materia.nome.toLowerCase().includes(busca));
  });

  protected searchTerm = signal<string>('');
  protected searchMateriaId = signal<Materia | null>(null);
  protected assuntos = signal<Assunto[]>([]);
  protected assuntosFiltrados = computed(() => {
    const busca = this.searchTerm()?.toLowerCase()?.trim() ?? null;
    const materiaId = this.searchMateriaId()?.id ?? null;
    const listaOriginal = this.assuntos();

    if (!busca && materiaId) {
      return listaOriginal.filter((assunto) => assunto.idMateria == materiaId);
    }

    if (busca && !materiaId) {
      return listaOriginal.filter((assunto) => assunto.nome.toLowerCase().includes(busca));
    }

    if (busca && materiaId) {
      return listaOriginal.filter(
        (assunto) => assunto.nome.toLowerCase().includes(busca) && assunto.idMateria == materiaId,
      );
    }

    return listaOriginal;
  });

  ngOnInit(): void {
    this.assuntos.set(this.assuntoService.listar());
    this.materias.set(this.materiaService.listar());
  }

  onAddAssunto() {
    this.router.navigate(['assunto', 'cadastro']);
  }

  searchMateria(event: any) {
    this.materiaSearch.set(event?.query);
  }

  abrirAutocomplete(ac: AutoComplete) {
    this.searchMateria({ query: '' } as any);

    queueMicrotask(() => {
      ac.show();
    });
  }

  fecharAutocomplete(ac: AutoComplete) {
    this.searchMateria({ query: '' } as any);

    queueMicrotask(() => {
      ac.hide();
    });
  }

  getMateriaPorAssunto(assunto: Assunto): Materia {
    return this.materiaService.buscarPorId(assunto.idMateria);
  }

  getQuestoesRelacionadas(assunto: Assunto): Questao[] {
    return this.questaoService.listarPorAssunto([assunto.id]);
  }

  onLimpar() {
    this.searchMateriaId.set(null);
    this.searchTerm.set('');
  }
}
