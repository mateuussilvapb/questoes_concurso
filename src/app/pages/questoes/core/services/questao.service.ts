//Angular
import { Injectable, inject } from '@angular/core';

//Aplicação
import { Questao } from '../models/questao.model';
import { TipoQuestao } from '../enums/tipo-questao.enum';
import { QuestaoFilter } from '../dtos/filter-questao.dto';
import { CreateQuestaoDto } from '../dtos/create-questao.dto';
import { UpdateQuestaoDto } from '../dtos/update-questao.dto';
import { SimNao, SIM_NAO_BOOLEAN } from '../../../../shared/enums/sim-nao.enum';
import { Util } from '../../../../shared/util/util';
import { QuestaoValidatorService } from './questao-validator.service';
import { QuestaoEntity } from '../../../../core/database/entities/questao-entity';
import { QuestaoRepository } from '../../../../core/repository/repositories/questao-repository/questao.repository';
import { AlternativasFactoryService } from './alternativas-factory.service';
import { AlternativaDto } from '../../alternativas/core/dtos/alternativa.dto';
import { Alternativa } from '../../alternativas/core/models/alternativa.model';
import { IntegrityService } from '../../../../core/storage/integrity/integrity.service';
import { ObservacoesQuestoes } from '../observacoes-questoes/models/observacoes-questoes-model';
import { LoadingOverlayService } from '../../../../shared/services/loading-overlay.service';

@Injectable({
  providedIn: 'root',
})
export class QuestaoService {
  private readonly integrity = inject(IntegrityService);
  private readonly repository = inject(QuestaoRepository);
  private readonly validator = inject(QuestaoValidatorService);
  private readonly factory = inject(AlternativasFactoryService);
  private readonly loadingOverlay = inject(LoadingOverlayService);

  // ======================================================
  // CRUD
  // ======================================================

  async listar(): Promise<Questao[]> {
    return this.loadingOverlay.wrap(async () => {
      const questoes = await this.repository.findAll();

      return this.ordenar(questoes).map((q) => this.mapToModel(q));
    });
  }

  async buscarPorId(id: string): Promise<Questao> {
    return this.loadingOverlay.wrap(async () => {
      const questao = await this.buscarEntidadePorId(id);

      return this.mapToModel(questao);
    });
  }

  async criar(dto: CreateQuestaoDto): Promise<Questao> {
    return this.loadingOverlay.wrap(async () => {
      const entidade = await this.validateAndMapCreateToEntity(dto);
      const salva = await this.repository.save(entidade);

      return this.mapToModel(salva);
    });
  }

  async atualizar(dto: UpdateQuestaoDto): Promise<Questao> {
    return this.loadingOverlay.wrap(async () => {
      const entidade = await this.validateAndMapUpdateToEntity(dto);
      const salva = await this.repository.save(entidade);

      return this.mapToModel(salva);
    });
  }

  async remover(id: string): Promise<void> {
    return this.loadingOverlay.wrap(async () => {
      await this.buscarEntidadePorId(id);

      const validation = await this.integrity.validarExclusaoQuestao(id);

      if (!validation.canDelete) {
        throw new Error(validation.message);
      }

      await this.integrity.removerHistoricosDaQuestao(id);

      await this.repository.delete(id);
    });
  }

  // ======================================================
  // CONSULTAS
  // ======================================================

  async pesquisar(filter?: QuestaoFilter): Promise<Questao[]> {
    const questoes = await this.listar();

    return this.aplicarFiltro(questoes, filter);
  }

  async listarFavoritas(): Promise<Questao[]> {
    return this.pesquisar({ favorita: SimNao.SIM });
  }

  async listarRevisadas(): Promise<Questao[]> {
    return this.pesquisar({ revisada: SimNao.SIM });
  }

  async listarPorMateria(idMateria: string): Promise<Questao[]> {
    return this.pesquisar({ idMateria });
  }

  async listarPorAssunto(idsAssuntos: string[]): Promise<Questao[]> {
    return this.pesquisar({ idsAssuntos });
  }

  async listarPorBanca(idBanca: string): Promise<Questao[]> {
    return this.pesquisar({ idBanca });
  }

  // ======================================================
  // FAVORITOS
  // ======================================================

  async favoritar(id: string): Promise<Questao> {
    return this.atualizarFavorita(id, true);
  }

  async desfavoritar(id: string): Promise<Questao> {
    return this.atualizarFavorita(id, false);
  }

  async toggleFavorita(id: string): Promise<Questao> {
    const questao = await this.buscarPorId(id);

    return this.atualizarFavorita(id, !questao.status.favorita);
  }

  // ======================================================
  // REVISÃO
  // ======================================================

  async marcarComoRevisada(id: string): Promise<Questao> {
    return this.atualizarRevisada(id, true);
  }

  async desmarcarRevisada(id: string): Promise<Questao> {
    return this.atualizarRevisada(id, false);
  }

  async toggleRevisada(id: string): Promise<Questao> {
    const questao = await this.buscarPorId(id);

    return this.atualizarRevisada(id, !questao.status.revisada);
  }

  // ======================================================
  // MARCAR PARA REVISÃO
  // ======================================================

  async marcarParaRevisao(id: string): Promise<Questao> {
    return this.atualizarMarcadaParaRevisao(id, true);
  }

  async desmarcarParaRevisao(id: string): Promise<Questao> {
    return this.atualizarMarcadaParaRevisao(id, false);
  }

  async toggleMarcadaParaRevisao(id: string): Promise<Questao> {
    const questao = await this.buscarPorId(id);

    return this.atualizarMarcadaParaRevisao(id, !questao.status.marcadaParaRevisao);
  }

  // ======================================================
  // ANOTAÇÕES
  // ======================================================

  async atualizarAnotacoes(id: string, observacao: ObservacoesQuestoes): Promise<Questao> {
    return this.loadingOverlay.wrap(async () => {
      const entidade = await this.buscarEntidadePorId(id);

      entidade.observacao = observacao;
      entidade.touch();

      const salva = await this.repository.save(entidade);

      return this.mapToModel(salva);
    });
  }

  // ======================================================
  // HELPERS
  // ======================================================

  private async buscarEntidadePorId(id: string): Promise<QuestaoEntity> {
    const questao = await this.repository.findById(id);

    if (!questao) {
      throw new Error('Questão não encontrada.');
    }

    return questao;
  }

  private async atualizarFavorita(id: string, favorita: boolean): Promise<Questao> {
    return this.loadingOverlay.wrap(async () => {
      const entidade = await this.buscarEntidadePorId(id);

      entidade.status = { ...entidade.status, favorita };
      entidade.touch();

      const salva = await this.repository.save(entidade);

      return this.mapToModel(salva);
    });
  }

  private async atualizarRevisada(id: string, revisada: boolean): Promise<Questao> {
    return this.loadingOverlay.wrap(async () => {
      const entidade = await this.buscarEntidadePorId(id);

      entidade.status = { ...entidade.status, revisada };
      entidade.touch();

      const salva = await this.repository.save(entidade);

      return this.mapToModel(salva);
    });
  }

  private async atualizarMarcadaParaRevisao(
    id: string,
    marcadaParaRevisao: boolean,
  ): Promise<Questao> {
    return this.loadingOverlay.wrap(async () => {
      const entidade = await this.buscarEntidadePorId(id);

      entidade.status = { ...entidade.status, marcadaParaRevisao };
      entidade.touch();

      const salva = await this.repository.save(entidade);

      return this.mapToModel(salva);
    });
  }

  private criarAlternativas(dto: {
    tipo: TipoQuestao;
    alternativas: AlternativaDto[];
  }): Alternativa[] {
    return dto.tipo === TipoQuestao.VF
      ? this.factory.criarAlternativasVF(dto.alternativas)
      : this.factory.criarAlternativas(dto.alternativas);
  }

  private async validateAndMapCreateToEntity(dto: CreateQuestaoDto): Promise<QuestaoEntity> {
    await this.validator.validarCriacao(dto);

    const questao = new QuestaoEntity();

    questao.enunciado = dto.enunciado.trim();
    questao.idMateria = dto.idMateria;
    questao.idsAssuntos = [...dto.idsAssuntos];
    questao.idBanca = dto.idBanca?.trim() || undefined;
    questao.nivelDificuldade = dto.nivelDificuldade;
    questao.tipo = dto.tipo;
    questao.alternativas = this.criarAlternativas(dto);
    questao.status = dto.status;
    questao.observacao = dto.observacao;

    return questao;
  }

  private async validateAndMapUpdateToEntity(dto: UpdateQuestaoDto): Promise<QuestaoEntity> {
    const atual = await this.buscarEntidadePorId(dto.id);

    await this.validator.validarAtualizacao(dto);

    atual.enunciado = dto.enunciado.trim();
    atual.idMateria = dto.idMateria;
    atual.idsAssuntos = [...dto.idsAssuntos];
    atual.idBanca = dto.idBanca?.trim() || undefined;
    atual.nivelDificuldade = dto.nivelDificuldade;
    atual.tipo = dto.tipo;
    atual.alternativas = this.criarAlternativas(dto);
    atual.status = dto.status;
    atual.observacao = dto.observacao;
    atual.touch();

    return atual;
  }

  private ordenar(questoes: QuestaoEntity[]): QuestaoEntity[] {
    return [...questoes].sort((a, b) => b.dataCriacao.getTime() - a.dataCriacao.getTime());
  }

  private aplicarFiltro(questoes: Questao[], filter?: QuestaoFilter): Questao[] {
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

    return questoes.filter((q) => predicates.every((predicate) => predicate(q)));
  }

  private mapToModel(entity: QuestaoEntity): Questao {
    return {
      id: entity.id,
      enunciado: entity.enunciado,
      idMateria: entity.idMateria,
      idsAssuntos: entity.idsAssuntos,
      idBanca: entity.idBanca,
      nivelDificuldade: entity.nivelDificuldade,
      tipo: entity.tipo,
      alternativas: entity.alternativas,
      status: entity.status,
      observacao: entity.observacao,
      dataCriacao: entity.dataCriacao.toISOString(),
      dataAtualizacao: entity.dataAtualizacao?.toISOString(),
    };
  }
}
