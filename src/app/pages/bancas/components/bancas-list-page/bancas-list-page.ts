//Angular
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

//Externo
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

//Aplicação
import { LayoutBasePages } from '../../../../shared/components/layout-base-pages/layout-base-pages';
import { ListBase } from '../../../../shared/components/list-base/list-base';
import { Questao } from '../../../questoes/core/models/questao.model';
import { QuestaoService } from '../../../questoes/core/services/questao.service';
import { Banca } from '../../core/models/banca.model';
import { BancaService } from '../../core/services/banca.service';
import { BancaCardPresentation } from '../banca-card-presentation/banca-card-presentation';

@Component({
  selector: 'app-bancas-list-page',
  imports: [
    //Angular
    FormsModule,

    //Aplicação
    LayoutBasePages,
    BancaCardPresentation,

    //Externo
    CardModule,
    ButtonModule,
    DividerModule,
    InputIconModule,
    IconFieldModule,
    InputTextModule,
  ],
  templateUrl: './bancas-list-page.html',
})
export class BancasListPage extends ListBase implements OnInit {
  private readonly bancaService = inject(BancaService);
  private readonly questaoService = inject(QuestaoService);

  protected searchTerm = signal<string>('');
  protected bancas = signal<Banca[]>([]);

  protected bancasFiltradas = computed(() => {
    const busca = this.searchTerm().toLowerCase().trim();
    const listaOriginal = this.bancas();

    if (!busca) {
      return listaOriginal;
    }

    return listaOriginal.filter((banca) => banca.nome.toLowerCase().includes(busca));
  });

  async ngOnInit(): Promise<void> {
    this.bancas.set(await this.bancaService.listar());
  }

  onAddBanca() {
    this.router.navigate(['banca', 'cadastro']);
  }

  getQuestoesRelacionadas(banca: Banca): Questao[] {
    return this.questaoService.listarPorBanca(banca.id);
  }
}
