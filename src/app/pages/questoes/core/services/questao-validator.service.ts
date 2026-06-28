import { AlternativasFactoryService } from './alternativas-factory.service';
import { Injectable, inject } from '@angular/core';

import { Alternativa } from '../../alternativas/core/models/alternativa.model';

import { TipoQuestao } from '../enums/tipo-questao.enum';
import { StorageService } from '../../../../core/storage/storage.service';
import { CreateQuestaoDto } from '../dtos/create-questao.dto';
import { UpdateQuestaoDto } from '../dtos/update-questao.dto';
import { Materia } from '../../../materias/core/models/materia.model';
import { StorageCollection } from '../../../../core/storage/storage.constants';
import { Assunto } from '../../../assuntos/core/models/assunto.model';
import { AlternativaDto } from '../../alternativas/core/dtos/alternativa.dto';

@Injectable({
  providedIn: 'root',
})
export class QuestaoValidatorService {
  private readonly storage = inject(StorageService);
  private readonly questaoFactoryService = inject(AlternativasFactoryService);

  // =====================================================
  // API
  // =====================================================

  validarCriacao(dto: CreateQuestaoDto): void {
    this.validarDeclaracao(dto.declaracao);

    this.validarMateria(dto.idMateria);

    this.validarAssuntos(dto.idMateria, dto.idsAssuntos);

    this.validarTipo(dto.tipo);

    this.validarNivel(dto.nivelDificuldade);

    this.validarAlternativas(dto.tipo, dto.alternativas);
  }

  validarAtualizacao(dto: UpdateQuestaoDto): void {
    if (!dto.id?.trim()) {
      throw new Error('Id inválido.');
    }

    this.validarCriacao(dto);
  }

  prepararAlternativas(tipo: TipoQuestao, alternativas: AlternativaDto[]): Alternativa[] {
    if (tipo === TipoQuestao.VF) {
      return this.questaoFactoryService.criarAlternativasVF(alternativas);
    }

    return this.questaoFactoryService.criarAlternativas(alternativas);
  }

  // =====================================================
  // DECLARAÇÃO
  // =====================================================

  private validarDeclaracao(declaracao: string): void {
    if (!declaracao?.trim()) {
      throw new Error('Informe a declaração da questão.');
    }
  }

  // =====================================================
  // MATÉRIA
  // =====================================================

  private validarMateria(idMateria: string): void {
    if (!idMateria) {
      throw new Error('Informe uma matéria.');
    }

    const materia = this.storage.getById<Materia>(StorageCollection.MATERIAS, idMateria);

    if (!materia) {
      throw new Error('Matéria inexistente.');
    }
  }

  // =====================================================
  // ASSUNTOS
  // =====================================================

  private validarAssuntos(idMateria: string, ids: string[]): void {
    if (!ids?.length) {
      throw new Error('Selecione ao menos um assunto.');
    }

    const repetidos = ids.length !== new Set(ids).size;

    if (repetidos) {
      throw new Error('Existem assuntos repetidos.');
    }

    const assuntos = this.storage.getAll<Assunto>(StorageCollection.ASSUNTOS);

    ids.forEach((id) => {
      const assunto = assuntos.find((a) => a.id === id);

      if (!assunto) {
        throw new Error(`Assunto ${id} inexistente.`);
      }

      if (assunto.idMateria !== idMateria) {
        throw new Error('Todos os assuntos devem pertencer à matéria selecionada.');
      }
    });
  }

  // =====================================================
  // TIPO
  // =====================================================

  private validarTipo(tipo: TipoQuestao): void {
    if (!tipo) {
      throw new Error('Informe o tipo da questão.');
    }
  }

  // =====================================================
  // NÍVEL
  // =====================================================

  private validarNivel(nivel: number): void {
    if (nivel == null) {
      throw new Error('Informe o nível de dificuldade.');
    }
  }

  // =====================================================
  // ALTERNATIVAS
  // =====================================================

  private validarAlternativas(tipo: TipoQuestao, alternativas: AlternativaDto[]): void {
    if (tipo === TipoQuestao.VF) {
      this.validarVF(alternativas);
      return;
    }

    this.validarMultiplaEscolha(alternativas);
  }

  private validarMultiplaEscolha(alternativas: AlternativaDto[]): void {
    if (!alternativas?.length) {
      throw new Error('Informe as alternativas.');
    }

    if (alternativas.length < 2) {
      throw new Error('A questão deve possuir pelo menos duas alternativas.');
    }

    const corretas = alternativas.filter((a) => a.correta);

    if (corretas.length !== 1) {
      throw new Error('A questão deve possuir exatamente uma alternativa correta.');
    }

    alternativas.forEach((a) => {
      if (!a.texto?.trim()) {
        throw new Error('Existe alternativa sem texto.');
      }
    });
  }

  private validarVF(alternativas: AlternativaDto[]): void {
    if (alternativas.length !== 2) {
      throw new Error('Questões verdadeiro/falso devem possuir duas alternativas.');
    }

    const corretas = alternativas.filter((a) => a.correta);

    if (corretas.length !== 1) {
      throw new Error('Questões verdadeiro/falso devem possuir exatamente uma resposta correta.');
    }
  }

}
