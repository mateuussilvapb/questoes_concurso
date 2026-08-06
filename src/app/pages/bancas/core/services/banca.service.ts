//Angular
import { Injectable, inject } from '@angular/core';

//Aplicação
import { Banca } from '../models/banca.model';
import { CreateBancaDto } from '../dtos/create-banca.dto';
import { UpdateBancaDto } from '../dtos/update-banca.dto';
import { BancaEntity } from '../../../../core/database/entities/banca-entity';
import { BancaRepository } from '../../../../core/repository/repositories/banca-repository/banca.repository';
import { IntegrityService } from '../../../../core/storage/integrity/integrity.service';
import { LoadingOverlayService } from '../../../../shared/services/loading-overlay.service';

@Injectable({
  providedIn: 'root',
})
export class BancaService {
  private readonly repository = inject(BancaRepository);
  private readonly integrityService = inject(IntegrityService);
  private readonly loadingOverlay = inject(LoadingOverlayService);

  async listar(): Promise<Banca[]> {
    return this.loadingOverlay.wrap(async () => {
      const bancas = await this.repository.findAll();

      return bancas.map((b) => this.mapToModel(b)).sort((a, b) => a.nome.localeCompare(b.nome));
    });
  }

  async buscarPorId(id: string): Promise<Banca> {
    return this.loadingOverlay.wrap(async () => {
      const banca = await this.buscarEntidadePorId(id);

      return this.mapToModel(banca);
    });
  }

  async pesquisar(texto: string): Promise<Banca[]> {
    const filtro = texto.trim().toLowerCase();
    const bancas = await this.listar();

    return bancas.filter((b) => b.nome.toLowerCase().includes(filtro));
  }

  async criar(dto: CreateBancaDto): Promise<Banca> {
    return this.loadingOverlay.wrap(async () => {
      this.validarNome(dto.nome);
      await this.validarDuplicidade(dto.nome);

      const entidade = new BancaEntity();
      entidade.nome = dto.nome.trim();
      entidade.descricao = dto.descricao.trim();

      const salva = await this.repository.save(entidade);

      return this.mapToModel(salva);
    });
  }

  async atualizar(dto: UpdateBancaDto): Promise<Banca> {
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

      const validation = this.integrityService.validarExclusaoBanca(id);

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

  private async buscarEntidadePorId(id: string): Promise<BancaEntity> {
    const banca = await this.repository.findById(id);

    if (!banca) {
      throw new Error('Banca não encontrada.');
    }

    return banca;
  }

  private validarNome(nome: string): void {
    if (!nome?.trim()) {
      throw new Error('Informe o nome da banca.');
    }
  }

  private async validarDuplicidade(nome: string, idIgnorado?: string): Promise<void> {
    const nomeNormalizado = nome.trim().toLowerCase();
    const bancas = await this.repository.findAll();

    const existe = bancas.some(
      (b) => b.id !== idIgnorado && b.nome.trim().toLowerCase() === nomeNormalizado,
    );

    if (existe) {
      throw new Error('Já existe uma banca com esse nome.');
    }
  }

  private mapToModel(entity: BancaEntity): Banca {
    return {
      id: entity.id,
      nome: entity.nome,
      descricao: entity.descricao,
      dataCriacao: entity.dataCriacao.toISOString(),
      dataAtualizacao: entity.dataAtualizacao?.toISOString(),
    };
  }
}
