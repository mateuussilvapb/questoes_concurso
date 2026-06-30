import { Injectable, inject } from '@angular/core';

import { StorageCollection } from '../../../../core/storage/storage.constants';
import { StorageService } from '../../../../core/storage/storage.service';

import { Questao } from '../models/questao.model';
import { TipoQuestao } from '../enums/tipo-questao.enum';
import { NivelDificuldade } from '../enums/nivel-dificuldade.enum';
import { QuestaoFilter } from '../dtos/filter-questao.dto';

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

      predicates.push((q) => q.enunciado.toLowerCase().includes(texto));
    }

    if (filter?.idMateria) {
      predicates.push((q) => q.idMateria === filter.idMateria);
    }

    if (filter?.idsAssuntos) {
      predicates.push((q) => q.idsAssuntos.some((id) => q.idsAssuntos.includes(id)));
    }

    if (filter?.nivelDificuldade !== undefined) {
      predicates.push((q) => q.nivelDificuldade === filter.nivelDificuldade);
    }

    if (filter?.tipo) {
      predicates.push((q) => q.tipo === filter.tipo);
    }

    if (filter?.favorita !== undefined) {
      predicates.push((q) => q.status.favorita === filter.favorita);
    }

    if (filter?.revisada !== undefined) {
      predicates.push((q) => q.status.revisada === filter.revisada);
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
