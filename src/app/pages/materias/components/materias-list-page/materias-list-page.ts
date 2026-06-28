import { AssuntoService } from './../../../assuntos/core/services/assunto.service';
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
import { MateriaCardPresentation } from '../materia-card-presentation/materia-card-presentation';
import { Assunto } from '../../../assuntos/core/models/assunto.model';
import { Questao } from '../../../questoes/core/models/questao.model';
import { QuestaoService } from '../../../questoes/core/services/questao.service';

@Component({
  selector: 'app-materias-list-page',
  imports: [
    //Angular
    FormsModule,
    //Aplicação
    LayoutBasePages,
    MateriaCardPresentation,
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
  private readonly assuntoService = inject(AssuntoService);
  private readonly questaoService = inject(QuestaoService);

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

  getAssuntosRelacionados(materia: Materia): Assunto[] {
    return this.assuntoService.buscarPorIdMateria(materia.id);
  }
  getQuestoesRelacionadas(materia: Materia): Questao[] {
    return this.questaoService.listarPorMateria(materia.id);
  }
}
