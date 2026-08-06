//Angular
import { Injectable, inject } from '@angular/core';

//Aplicação
import { Assunto } from '../models/assunto.model';
import { CreateAssuntoDto } from '../dtos/create-assunto.dto';
import { UpdateAssuntoDto } from '../dtos/update-assunto.dto';
import { AssuntoEntity } from '../../../../core/database/entities/assunto-entity';
import { AssuntoRepository } from '../../../../core/repository/repositories/assunto-repository/assunto.repository';
import { IntegrityService } from '../../../../core/storage/integrity/integrity.service';
import { LoadingOverlayService } from '../../../../shared/services/loading-overlay.service';

@Injectable({
  providedIn: 'root',
})
export class AssuntoService {
  private readonly repository = inject(AssuntoRepository);
  private readonly integrityService = inject(IntegrityService);
  private readonly loadingOverlay = inject(LoadingOverlayService);

  async listar(): Promise<Assunto[]> {
    return this.loadingOverlay.wrap(async () => {
      const assuntos = await this.repository.findAll();

      return assuntos.map((a) => this.mapToModel(a)).sort((a, b) => a.nome.localeCompare(b.nome));
    });
  }

  async buscarPorId(id: string): Promise<Assunto> {
    return this.loadingOverlay.wrap(async () => {
      const assunto = await this.buscarEntidadePorId(id);

      return this.mapToModel(assunto);
    });
  }

  async buscarPorIdMateria(idMateria: string): Promise<Assunto[]> {
    const assuntos = await this.listar();

    return assuntos.filter((m) => m.idMateria == idMateria);
  }

  async pesquisar(texto: string): Promise<Assunto[]> {
    const filtro = texto.trim().toLowerCase();
    const assuntos = await this.listar();

    return assuntos.filter((m) => m.nome.toLowerCase().includes(filtro));
  }

  async criar(dto: CreateAssuntoDto): Promise<Assunto> {
    return this.loadingOverlay.wrap(async () => {
      this.validarNome(dto.nome);
      await this.validarDuplicidade(dto.nome);

      const entidade = new AssuntoEntity();
      entidade.nome = dto.nome.trim();
      entidade.descricao = dto.descricao.trim();
      entidade.idMateria = dto.idMateria.trim();

      const salva = await this.repository.save(entidade);

      return this.mapToModel(salva);
    });
  }

  async atualizar(dto: UpdateAssuntoDto): Promise<Assunto> {
    return this.loadingOverlay.wrap(async () => {
      const entidade = await this.buscarEntidadePorId(dto.id);

      this.validarNome(dto.nome);
      await this.validarDuplicidade(dto.nome, dto.id);

      entidade.nome = dto.nome.trim();
      entidade.descricao = dto.descricao.trim();
      entidade.idMateria = dto.idMateria.trim();
      entidade.touch();

      const salva = await this.repository.save(entidade);

      return this.mapToModel(salva);
    });
  }

  async remover(id: string): Promise<void> {
    return this.loadingOverlay.wrap(async () => {
      await this.buscarEntidadePorId(id);

      const validation = this.integrityService.validarExclusaoAssunto(id);

      if (!validation.canDelete) {
        throw new Error(validation.message);
      }

      await this.repository.delete(id);
    });
  }

  async existe(id: string): Promise<boolean> {
    return this.repository.exists(id);
  }

  async quantidade(): Promise<number> {
    return this.repository.count();
  }

  // ======================================================

  private async buscarEntidadePorId(id: string): Promise<AssuntoEntity> {
    const assunto = await this.repository.findById(id);

    if (!assunto) {
      throw new Error('Assunto não encontrada.');
    }

    return assunto;
  }

  private validarNome(nome: string): void {
    if (!nome?.trim()) {
      throw new Error('Informe o nome do assunto.');
    }
  }

  private async validarDuplicidade(nome: string, idIgnorado?: string): Promise<void> {
    const nomeNormalizado = nome.trim().toLowerCase();
    const assuntos = await this.repository.findAll();

    const existe = assuntos.some(
      (m) => m.id !== idIgnorado && m.nome.trim().toLowerCase() === nomeNormalizado,
    );

    if (existe) {
      throw new Error('Já existe um asusnto com esse nome.');
    }
  }

  private mapToModel(entity: AssuntoEntity): Assunto {
    return {
      id: entity.id,
      nome: entity.nome,
      descricao: entity.descricao,
      idMateria: entity.idMateria,
      dataCriacao: entity.dataCriacao.toISOString(),
      dataAtualizacao: entity.dataAtualizacao?.toISOString(),
    };
  }
}
