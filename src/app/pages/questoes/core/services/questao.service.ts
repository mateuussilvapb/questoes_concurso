import { IdGeneratorService } from './../../../../core/storage/id-generator/id-generator.service';
import { Injectable, inject } from '@angular/core';

import { Questao } from '../models/questao.model';

import { QuestaoValidatorService } from './questao-validator.service';
import { AlternativasFactoryService } from './alternativas-factory.service';

import { IntegrityService } from '../../../../core/storage/integrity/integrity.service';
import { QuestaoRepository } from '../repositories/questao-repository';
import { CreateQuestaoDto } from '../dtos/create-questao.dto';
import { UpdateQuestaoDto } from '../dtos/update-questao.dto';
import { QuestaoFilter } from '../dtos/filter-questao.dto';
import { ObservacoesQuestoes } from '../observacoes-questoes/models/observacoes-questoes-model';
import { TipoQuestao } from '../enums/tipo-questao.enum';
import { AlternativaDto } from '../../alternativas/core/dtos/alternativa.dto';
import { Alternativa } from '../../alternativas/core/models/alternativa.model';

@Injectable({
  providedIn: 'root',
})
export class QuestaoService {
  private readonly integrity = inject(IntegrityService);
  private readonly repository = inject(QuestaoRepository);
  private readonly validator = inject(QuestaoValidatorService);
  private readonly factory = inject(AlternativasFactoryService);
  private readonly idGeneratorService = inject(IdGeneratorService);

  // ======================================================
  // CRUD
  // ======================================================

  listar(): Questao[] {
    return this.repository.find();
  }

  buscarPorId(id: string): Questao {
    const questao = this.repository.findById(id);

    if (!questao) {
      throw new Error('Questão não encontrada.');
    }

    return questao;
  }

  criar(dto: CreateQuestaoDto): Questao {
    const questao = this.validateAndMapCreateToEntity(dto);
    return this.repository.insert(questao);
  }

  atualizar(dto: UpdateQuestaoDto): Questao {
    const atualizado = this.validateAndMapUpdateToEntity(dto);
    return this.repository.update(atualizado);
  }

  remover(id: string): void {
    this.buscarPorId(id);

    const validation = this.integrity.validarExclusaoQuestao(id);

    if (!validation.canDelete) {
      throw new Error(validation.message);
    }

    this.integrity.removerHistoricosDaQuestao(id);

    this.repository.delete(id);
  }

  // ======================================================
  // CONSULTAS
  // ======================================================

  pesquisar(filter?: QuestaoFilter): Questao[] {
    return this.repository.find(filter);
  }

  listarFavoritas(): Questao[] {
    return this.repository.find({
      favorita: true,
    });
  }

  listarRevisadas(): Questao[] {
    return this.repository.find({
      revisada: true,
    });
  }

  listarPorMateria(idMateria: string): Questao[] {
    return this.repository.find({
      idMateria,
    });
  }

  listarPorAssunto(idsAssuntos: string[]): Questao[] {
    return this.repository.find({
      idsAssuntos,
    });
  }

  // ======================================================
  // FAVORITOS
  // ======================================================

  favoritar(id: string): Questao {
    return this.atualizarFavorita(id, true);
  }

  desfavoritar(id: string): Questao {
    return this.atualizarFavorita(id, false);
  }

  toggleFavorita(id: string): Questao {
    const questao = this.buscarPorId(id);

    return this.atualizarFavorita(id, !questao.status.favorita);
  }

  // ======================================================
  // REVISÃO
  // ======================================================

  marcarComoRevisada(id: string): Questao {
    return this.atualizarRevisada(id, true);
  }

  desmarcarRevisada(id: string): Questao {
    return this.atualizarRevisada(id, false);
  }

  toggleRevisada(id: string): Questao {
    const questao = this.buscarPorId(id);

    return this.atualizarRevisada(id, !questao.status.revisada);
  }

  // ======================================================
  // ANOTAÇÕES
  // ======================================================

  atualizarAnotacoes(id: string, observacao: ObservacoesQuestoes): Questao {
    const questao = this.buscarPorId(id);

    const atualizado: Questao = {
      ...questao,
      observacao: observacao,
    };

    return this.repository.update(atualizado);
  }

  // ======================================================
  // HELPERS
  // ======================================================

  private atualizarFavorita(id: string, favorita: boolean): Questao {
    const questao = this.buscarPorId(id);

    const atualizado: Questao = {
      ...questao,

      status: {
        ...questao.status,

        favorita,
      },
    };

    return this.repository.update(atualizado);
  }

  private atualizarRevisada(id: string, revisada: boolean): Questao {
    const questao = this.buscarPorId(id);

    const atualizado: Questao = {
      ...questao,

      status: {
        ...questao.status,

        revisada,
      },
    };

    return this.repository.update(atualizado);
  }

  private criarAlternativas(dto: {
    tipo: TipoQuestao;
    alternativas: AlternativaDto[];
  }): Alternativa[] {
    return dto.tipo === TipoQuestao.VF
      ? this.factory.criarAlternativasVF(dto.alternativas)
      : this.factory.criarAlternativas(dto.alternativas);
  }

  validateAndMapCreateToEntity(dto: CreateQuestaoDto): Questao {
    this.validator.validarCriacao(dto);

    const questao: Questao = {
      id: this.idGeneratorService.generate(),
      enunciado: dto.enunciado.trim(),
      idMateria: dto.idMateria,
      idsAssuntos: [...dto.idsAssuntos],
      nivelDificuldade: dto.nivelDificuldade,
      tipo: dto.tipo,
      alternativas: this.criarAlternativas(dto),
      status: dto.status,
      observacao: dto.observacao,
      dataAtualizacao: new Date().toISOString(),
      dataCriacao: new Date().toISOString(),
    };

    return this.repository.insert(questao);
  }

  validateAndMapUpdateToEntity(dto: UpdateQuestaoDto): Questao {
    const atual = this.buscarPorId(dto.id);
    this.validator.validarAtualizacao(dto);
    const atualizado: Questao = {
      ...atual,
      enunciado: dto.enunciado.trim(),
      idMateria: dto.idMateria,
      idsAssuntos: [...dto.idsAssuntos],
      nivelDificuldade: dto.nivelDificuldade,
      tipo: dto.tipo,
      alternativas: this.criarAlternativas(dto),
      status: dto.status,
      observacao: dto.observacao,
    };

    return this.repository.update(atualizado);
  }
}
