//Angular
import { Injectable, inject } from '@angular/core';

//Aplicação
import { Questao } from '../models/questao.model';
import { Util } from '../../../../shared/util/util';
import { QuestaoFilter } from '../dtos/filter-questao.dto';
import { SIM_NAO_BOOLEAN } from './../../../../shared/enums/sim-nao.enum';
import { StorageService } from '../../../../core/storage/storage.service';
import { StorageCollection } from '../../../../core/storage/storage.constants';

@Injectable({
  providedIn: 'root',
})
export class QuestaoRepository {
  private readonly storage = inject(StorageService);

  findAll(): Questao[] {
    return this.storage.getAll<Questao>(StorageCollection.QUESTOES);
  }

  findById(id: string): Questao | undefined {
    return this.storage.getById<Questao>(StorageCollection.QUESTOES, id);
  }

  find(filter?: QuestaoFilter): Questao[] {
    const predicates: Array<(q: Questao) => boolean> = [];

    if (filter?.enunciado?.trim()) {
      const texto = filter.enunciado.trim().toLowerCase();

      predicates.push((q) => {
        const onlyTextEnunciado = Util.htmlToText(q.enunciado);
        return onlyTextEnunciado.trim().toLocaleLowerCase().includes(texto);
      });
    }

    if (filter?.observacao?.trim()) {
      const texto = filter.observacao.trim().toLowerCase();

      predicates.push((q) => {
        const onlyTextObservacao = Util.htmlToText(q.observacao.observacoes);
        return onlyTextObservacao.trim().toLocaleLowerCase().includes(texto);
      });
    }

    if (filter?.idMateria) {
      predicates.push((q) => q.idMateria === filter.idMateria);
    }

    if (filter?.idsAssuntos?.length) {
      predicates.push((q) => filter.idsAssuntos!.some((id) => q.idsAssuntos.includes(id)));
    }

    if (filter?.idBanca) {
      predicates.push((q) => q.idBanca === filter.idBanca);
    }

    if (filter?.nivelDificuldade) {
      predicates.push((q) => q.nivelDificuldade === filter.nivelDificuldade);
    }

    if (filter?.tipo) {
      predicates.push((q) => q.tipo === filter.tipo);
    }

    if (filter?.favorita !== undefined && filter?.favorita !== null) {
      const favorita = filter?.favorita;
      if (typeof favorita === 'boolean') {
        predicates.push((q) => q.status.favorita === favorita);
      } else if (typeof favorita === 'number') {
        predicates.push((q) => q.status.favorita === SIM_NAO_BOOLEAN[favorita]);
      }
    }

    if (filter?.revisada !== undefined && filter?.revisada !== null) {
      const revisada = filter?.revisada;
      if (typeof revisada === 'boolean') {
        predicates.push((q) => q.status.revisada === revisada);
      } else if (typeof revisada === 'number') {
        predicates.push((q) => q.status.revisada === SIM_NAO_BOOLEAN[revisada]);
      }
    }

    if (filter?.marcadaParaRevisao != undefined && filter?.marcadaParaRevisao != null) {
      const marcadaParaRevisao = filter?.marcadaParaRevisao;
      if (typeof marcadaParaRevisao === 'boolean') {
        predicates.push((q) => q.status.marcadaParaRevisao === marcadaParaRevisao);
      } else if (typeof marcadaParaRevisao === 'number') {
        predicates.push((q) => q.status.marcadaParaRevisao === SIM_NAO_BOOLEAN[marcadaParaRevisao]);
      }
    }

    return this.ordenar(
      this.findAll().filter((q) => predicates.every((predicate) => predicate(q))),
    );
  }

  private ordenar(questoes: Questao[]): Questao[] {
    return [...questoes].sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
  }

  exists(id: string): boolean {
    return this.findById(id) !== undefined;
  }

  insert(questao: Questao): Questao {
    return this.storage.insert<Questao>(StorageCollection.QUESTOES, questao);
  }

  update(questao: Questao): Questao {
    return this.storage.update<Questao>(StorageCollection.QUESTOES, questao);
  }

  delete(id: string): void {
    this.storage.delete(StorageCollection.QUESTOES, id);
  }

  count(): number {
    return this.findAll().length;
  }

  save(questao: Questao): Questao {
    if (this.exists(questao.id)) {
      return this.update(questao);
    }

    return this.insert(questao);
  }
}
