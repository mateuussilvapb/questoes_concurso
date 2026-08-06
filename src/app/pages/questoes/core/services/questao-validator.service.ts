import { AlternativasFactoryService } from './alternativas-factory.service';
import { Injectable, inject } from '@angular/core';

import { Alternativa } from '../../alternativas/core/models/alternativa.model';

import { TipoQuestao } from '../enums/tipo-questao.enum';
import { CreateQuestaoDto } from '../dtos/create-questao.dto';
import { UpdateQuestaoDto } from '../dtos/update-questao.dto';
import { AlternativaDto } from '../../alternativas/core/dtos/alternativa.dto';
import { MateriaRepository } from '../../../../core/repository/repositories/materia-repository/materia.repository';
import { AssuntoRepository } from '../../../../core/repository/repositories/assunto-repository/assunto.repository';

@Injectable({
  providedIn: 'root',
})
export class QuestaoValidatorService {
  private readonly materiaRepository = inject(MateriaRepository);
  private readonly assuntoRepository = inject(AssuntoRepository);
  private readonly questaoFactoryService = inject(AlternativasFactoryService);

  // =====================================================
  // API
  // =====================================================

  async validarCriacao(dto: CreateQuestaoDto): Promise<void> {
    this.validarDeclaracao(dto.enunciado);

    await this.validarMateria(dto.idMateria);

    await this.validarAssuntos(dto.idMateria, dto.idsAssuntos);

    this.validarTipo(dto.tipo);

    this.validarNivel(dto.nivelDificuldade);

    this.validarAlternativas(dto.tipo, dto.alternativas);
  }

  async validarAtualizacao(dto: UpdateQuestaoDto): Promise<void> {
    if (!dto.id?.trim()) {
      throw new Error('Id inválido.');
    }

    await this.validarCriacao(dto);
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

  private async validarMateria(idMateria: string): Promise<void> {
    if (!idMateria) {
      throw new Error('Informe uma matéria.');
    }

    const materia = await this.materiaRepository.findById(idMateria);

    if (!materia) {
      throw new Error('Matéria inexistente.');
    }
  }

  // =====================================================
  // ASSUNTOS
  // =====================================================

  private async validarAssuntos(idMateria: string, ids: string[]): Promise<void> {
    if (!ids?.length) {
      throw new Error('Selecione ao menos um assunto.');
    }

    const repetidos = ids.length !== new Set(ids).size;

    if (repetidos) {
      throw new Error('Existem assuntos repetidos.');
    }

    const assuntos = await this.assuntoRepository.findAll();

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
