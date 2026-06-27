//Angular
import { Injectable, inject } from '@angular/core';

//Aplicação
import { Materia } from '../models/materia.model';
import { CreateMateriaDto } from '../dtos/create-materia.dto';
import { UpdateMateriaDto } from '../dtos/update-materia.dto';
import { StorageService } from '../../../../core/storage/storage.service';
import { StorageCollection } from '../../../../core/storage/storage.constants';
import { IntegrityService } from './../../../../core/storage/integrity/integrity.service';


@Injectable({
  providedIn: 'root',
})
export class MateriaService {
  private readonly storage = inject(StorageService);
  private readonly integrityService = inject(IntegrityService);

  listar(): Materia[] {
    return this.storage
      .getAll<Materia>(StorageCollection.MATERIAS)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }

  buscarPorId(id: string): Materia {
    const materia = this.storage.getById<Materia>(StorageCollection.MATERIAS, id);

    if (!materia) {
      throw new Error('Matéria não encontrada.');
    }

    return materia;
  }

  pesquisar(texto: string): Materia[] {
    const filtro = texto.trim().toLowerCase();

    return this.listar().filter((m) => m.nome.toLowerCase().includes(filtro));
  }

  criar(dto: CreateMateriaDto): Materia {
    this.validarNome(dto.nome);

    this.validarDuplicidade(dto.nome);

    return this.storage.insert<Materia>(StorageCollection.MATERIAS, {
      nome: dto.nome.trim(),
      descricao: dto.descricao.trim(),
    });
  }

  atualizar(dto: UpdateMateriaDto): Materia {
    const materia = this.buscarPorId(dto.id);

    this.validarNome(dto.nome);

    this.validarDuplicidade(dto.nome, dto.id);

    return this.storage.update<Materia>(StorageCollection.MATERIAS, {
      ...materia,
      nome: dto.nome.trim(),
      descricao: dto.descricao.trim(),
    });
  }

  remover(id: string): void {
    this.buscarPorId(id);

    const validation = this.integrityService.validarExclusaoMateria(id);

    if (!validation.canDelete) {
      throw new Error(validation.message);
    }

    this.storage.delete(StorageCollection.MATERIAS, id);
  }

  existe(id: string): boolean {
    return this.storage.exists(StorageCollection.MATERIAS, id);
  }

  quantidade(): number {
    return this.listar().length;
  }

  // ======================================================

  private validarNome(nome: string): void {
    if (!nome?.trim()) {
      throw new Error('Informe o nome da matéria.');
    }
  }

  private validarDuplicidade(nome: string, idIgnorado?: string): void {
    const nomeNormalizado = nome.trim().toLowerCase();

    const existe = this.listar().some(
      (m) => m.id !== idIgnorado && m.nome.trim().toLowerCase() === nomeNormalizado,
    );

    if (existe) {
      throw new Error('Já existe uma matéria com esse nome.');
    }
  }
}
