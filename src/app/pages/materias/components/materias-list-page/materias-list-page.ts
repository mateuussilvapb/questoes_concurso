// Angular
import { FormsModule } from '@angular/forms';
import { Component, inject, OnInit, signal, computed } from '@angular/core';

// Aplicação
import { Materia } from '../../core/models/materia.model';
import { MateriaService } from './../../core/services/materia.service';
import { ListBase } from '../../../../shared/components/list-base/list-base';
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';

// Externo
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-materias-list-page',
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
  ],
  templateUrl: './materias-list-page.html',
})
export class MateriasListPage extends ListBase implements OnInit {
  private readonly materiaService = inject(MateriaService);

  protected searchTerm = signal<string>('');

  protected materias = signal<Materia[]>([]);

  protected materiasFiltradas = computed(() => {
    const busca = this.searchTerm().toLowerCase().trim();
    const listaOriginal = this.materias();

    if (!busca) {
      return listaOriginal;
    }

    return listaOriginal.filter((materia) => materia.nome.toLowerCase().includes(busca));
  });

  ngOnInit(): void {
    this.materias.set(this.materiaService.listar());
  }

  onAddMateria() {
    this.router.navigate(['materia', 'cadastro']);
  }

  onEditar(materia: Materia) {
    this.router.navigate(['materia', 'edicao', materia.id]);
  }

  onExcluir(materia: Materia) {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir esta matéria?<br>A ação não poderá ser desfeita.',
      header: 'Confirma?',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.excluir(materia.id),
    });
  }

  excluir(id: string) {
    try {
      this.materiaService.remover(id);
      this.messageService.showSuccess('Matéria excluída com sucesso!');
      this.ngOnInit();
    } catch (e: any) {
      console.error(e);
      const mensagem = e?.message ?? 'Erro ao excluir uma matéria. Tente novamente';
      this.messageService.showError(mensagem);
      this.submitting.set(false);
      return;
    }
  }
}
