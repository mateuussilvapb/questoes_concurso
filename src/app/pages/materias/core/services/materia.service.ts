//Angular
import { Injectable, inject } from '@angular/core';

//Aplicação
import { Materia } from '../models/materia.model';
import { CreateMateriaDto } from '../dtos/create-materia.dto';
import { UpdateMateriaDto } from '../dtos/update-materia.dto';
import { MateriaEntity } from '../../../../core/database/entities/materia-entity';
import { MateriaRepository } from '../../../../core/repository/repositories/materia-repository/materia.repository';
import { IntegrityService } from '../../../../core/storage/integrity/integrity.service';
import { LoadingOverlayService } from '../../../../shared/services/loading-overlay.service';

@Injectable({
  providedIn: 'root',
})
export class MateriaService {
  private readonly repository = inject(MateriaRepository);
  private readonly integrityService = inject(IntegrityService);
  private readonly loadingOverlay = inject(LoadingOverlayService);

  async listar(): Promise<Materia[]> {
    return this.loadingOverlay.wrap(async () => {
      const materias = await this.repository.findAll();

      return materias.map((m) => this.mapToModel(m)).sort((a, b) => a.nome.localeCompare(b.nome));
    });
  }

  async buscarPorId(id: string): Promise<Materia> {
    return this.loadingOverlay.wrap(async () => {
      const materia = await this.buscarEntidadePorId(id);

      return this.mapToModel(materia);
    });
  }

  async pesquisar(texto: string): Promise<Materia[]> {
    const filtro = texto.trim().toLowerCase();
    const materias = await this.listar();

    return materias.filter((m) => m.nome.toLowerCase().includes(filtro));
  }

  async criar(dto: CreateMateriaDto): Promise<Materia> {
    return this.loadingOverlay.wrap(async () => {
      this.validarNome(dto.nome);
      await this.validarDuplicidade(dto.nome);

      const entidade = new MateriaEntity();
      entidade.nome = dto.nome.trim();
      entidade.descricao = dto.descricao.trim();

      const salva = await this.repository.save(entidade);

      return this.mapToModel(salva);
    });
  }

  async atualizar(dto: UpdateMateriaDto): Promise<Materia> {
    return this.loadingOverlay.wrap(async () => {
      const entidade = await this.buscarEntidadePorId(dto.id);

      this.validarNome(dto.nome);
      await this.validarDuplicidade(dto.nome, dto.id);

      entidade.nome = dto.nome.trim();
      entidade.descricao = dto.descricao.trim();
      entidade.touch();

      const salva = await this.repository.save(entidade);

      return this.mapToModel(salva);
    });
  }

  async remover(id: string): Promise<void> {
    return this.loadingOverlay.wrap(async () => {
      await this.buscarEntidadePorId(id);

      const validation = this.integrityService.validarExclusaoMateria(id);

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

  private async buscarEntidadePorId(id: string): Promise<MateriaEntity> {
    const materia = await this.repository.findById(id);

    if (!materia) {
      throw new Error('Matéria não encontrada.');
    }

    return materia;
  }

  private validarNome(nome: string): void {
    if (!nome?.trim()) {
      throw new Error('Informe o nome da matéria.');
    }
  }

  private async validarDuplicidade(nome: string, idIgnorado?: string): Promise<void> {
    const nomeNormalizado = nome.trim().toLowerCase();
    const materias = await this.repository.findAll();

    const existe = materias.some(
      (m) => m.id !== idIgnorado && m.nome.trim().toLowerCase() === nomeNormalizado,
    );

    if (existe) {
      throw new Error('Já existe uma matéria com esse nome.');
    }
  }

  private mapToModel(entity: MateriaEntity): Materia {
    return {
      id: entity.id,
      nome: entity.nome,
      descricao: entity.descricao,
      dataCriacao: entity.dataCriacao.toISOString(),
      dataAtualizacao: entity.dataAtualizacao?.toISOString(),
    };
  }
}
