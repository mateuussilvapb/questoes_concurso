//Angular
import { Injectable, inject } from '@angular/core';

//Aplicação
import { Assunto } from '../models/assunto.model';
import { CreateAssuntoDto } from '../dtos/create-assunto.dto';
import { UpdateAssuntoDto } from '../dtos/update-assunto.dto';
import { StorageService } from '../../../../core/storage/storage.service';
import { StorageCollection } from '../../../../core/storage/storage.constants';
import { IntegrityService } from '../../../../core/storage/integrity/integrity.service';

@Injectable({
  providedIn: 'root',
})
export class AssuntoService {
  private readonly storage = inject(StorageService);
  private readonly integrityService = inject(IntegrityService);

  listar(): Assunto[] {
    return this.storage
      .getAll<Assunto>(StorageCollection.ASSUNTOS)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }

  buscarPorId(id: string): Assunto {
    const assunto = this.storage.getById<Assunto>(StorageCollection.ASSUNTOS, id);

    if (!assunto) {
      throw new Error('Assunto não encontrada.');
    }

    return assunto;
  }

  buscarPorIdMateria(idMateria: string): Assunto[] {
    return this.listar().filter((m) => m.idMateria == idMateria);
  }

  pesquisar(texto: string): Assunto[] {
    const filtro = texto.trim().toLowerCase();

    return this.listar().filter((m) => m.nome.toLowerCase().includes(filtro));
  }

  criar(dto: CreateAssuntoDto): Assunto {
    this.validarNome(dto.nome);

    this.validarDuplicidade(dto.nome);

    return this.storage.insert<Assunto>(StorageCollection.ASSUNTOS, {
      nome: dto.nome.trim(),
      descricao: dto.descricao.trim(),
      idMateria: dto.idMateria.trim(),
    });
  }

  atualizar(dto: UpdateAssuntoDto): Assunto {
    const assunto = this.buscarPorId(dto.id);

    this.validarNome(dto.nome);

    this.validarDuplicidade(dto.nome, dto.id);

    return this.storage.update<Assunto>(StorageCollection.ASSUNTOS, {
      ...assunto,
      nome: dto.nome.trim(),
      descricao: dto.descricao.trim(),
      idMateria: dto.idMateria.trim(),
    });
  }

  remover(id: string): void {
    this.buscarPorId(id);

    const validation = this.integrityService.validarExclusaoAssunto(id);

    if (!validation.canDelete) {
      throw new Error(validation.message);
    }

    this.storage.delete(StorageCollection.ASSUNTOS, id);
  }

  existe(id: string): boolean {
    return this.storage.exists(StorageCollection.ASSUNTOS, id);
  }

  quantidade(): number {
    return this.listar().length;
  }

  // ======================================================

  private validarNome(nome: string): void {
    if (!nome?.trim()) {
      throw new Error('Informe o nome do assunto.');
    }
  }

  private validarDuplicidade(nome: string, idIgnorado?: string): void {
    const nomeNormalizado = nome.trim().toLowerCase();

    const existe = this.listar().some(
      (m) => m.id !== idIgnorado && m.nome.trim().toLowerCase() === nomeNormalizado,
    );

    if (existe) {
      throw new Error('Já existe um asusnto com esse nome.');
    }
  }
}
