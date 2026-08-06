import { AssuntoService } from './../../../assuntos/core/services/assunto.service';
// Angular
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Aplicação
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';
import { ListBase } from '../../../../shared/components/list-base/list-base';
import { Assunto } from '../../../assuntos/core/models/assunto.model';
import { Questao } from '../../../questoes/core/models/questao.model';
import { QuestaoService } from '../../../questoes/core/services/questao.service';
import { Materia } from '../../core/models/materia.model';
import { MateriaCardPresentation } from '../materia-card-presentation/materia-card-presentation';
import { MateriaService } from './../../core/services/materia.service';

// Externo
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';

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
    ButtonModule,
    DividerModule,
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

  async ngOnInit(): Promise<void> {
    this.materias.set(await this.materiaService.listar());
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
