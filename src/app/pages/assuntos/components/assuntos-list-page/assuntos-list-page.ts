//Angular
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

//Externo
import { AutoComplete, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

//Aplicação
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';
import { ListBase } from '../../../../shared/components/list-base/list-base';
import { Materia } from '../../../materias/core/models/materia.model';
import { MateriaService } from '../../../materias/core/services/materia.service';
import { Assunto } from '../../core/models/assunto.model';
import { AssuntoService } from '../../core/services/assunto.service';

@Component({
  selector: 'app-assuntos-list-page',
  imports: [
    //Angular
    FormsModule,
    //Aplicação
    LayoutBasePages,
    //Externo
    CardModule,
    TableModule,
    ButtonModule,
    TooltipModule,
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

  onEditar(assunto: Assunto) {
    this.router.navigate(['assunto', 'edicao', assunto.id]);
  }

  onExcluir(assunto: Assunto) {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir este Assunto?<br>A ação não poderá ser desfeita.',
      header: 'Confirma?',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.excluir(assunto.id),
    });
  }

  excluir(id: string) {
    try {
      this.assuntoService.remover(id);
      this.messageService.showSuccess('Assunto excluído com sucesso!');
      this.ngOnInit();
    } catch (e: any) {
      console.error(e);
      const mensagem = e?.message ?? 'Erro ao excluir um assunto. Tente novamente';
      this.messageService.showError(mensagem);
      this.submitting.set(false);
      return;
    }
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

  getMateriaNome(assunto: Assunto): string {
    return this.materiaService.buscarPorId(assunto.idMateria).nome ?? '-';
  }

  onLimpar() {
    this.searchMateriaId.set(null);
    this.searchTerm.set('');
  }
}
