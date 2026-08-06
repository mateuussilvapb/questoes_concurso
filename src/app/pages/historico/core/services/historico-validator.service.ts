//Angular
import { Injectable, inject } from '@angular/core';

//Aplicação
import { CreateHistoricoQuestao } from '../dtos/create-historico.dto';
import { UpdateHistoricoQuestao } from '../dtos/update-historico.dto';
import { MateriaRepository } from '../../../../core/repository/repositories/materia-repository/materia.repository';
import { AssuntoRepository } from '../../../../core/repository/repositories/assunto-repository/assunto.repository';
import { QuestaoRepository } from '../../../../core/repository/repositories/questao-repository/questao.repository';

@Injectable({
  providedIn: 'root',
})
export class HistoricoValidatorService {
  private readonly materiaRepository = inject(MateriaRepository);
  private readonly assuntoRepository = inject(AssuntoRepository);
  private readonly questaoRepository = inject(QuestaoRepository);

  // =====================================================
  // API
  // =====================================================

  async validarCriacao(dto: CreateHistoricoQuestao): Promise<void> {
    const questao = await this.validarQuestao(dto.idQuestao);

    await this.validarMateria(dto.idMateria);

    await this.validarAssuntos(dto.idMateria, dto.idsAssuntos);

    this.validarAlternativaSelecionada(questao, dto.idAlternativaSelecionada, dto.correta);

    this.validarTempoResposta(dto.tempoResposta);

    this.validarNivel(dto.dificuldade);

    this.validarRespondidaEm(dto.respondidaEm);
  }

  async validarAtualizacao(dto: UpdateHistoricoQuestao): Promise<void> {
    if (!dto.id?.trim()) {
      throw new Error('Id inválido.');
    }

    await this.validarCriacao(dto);
  }

  // =====================================================
  // QUESTÃO
  // =====================================================

  private async validarQuestao(idQuestao: string) {
    if (!idQuestao) {
      throw new Error('Informe a questão respondida.');
    }

    const questao = await this.questaoRepository.findById(idQuestao);

    if (!questao) {
      throw new Error('Questão inexistente.');
    }

    return questao;
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
  // ALTERNATIVA SELECIONADA
  // =====================================================

  private validarAlternativaSelecionada(
    questao: { alternativas: { id: string; correta: boolean }[] },
    idAlternativaSelecionada: string,
    correta: boolean,
  ): void {
    if (!idAlternativaSelecionada) {
      throw new Error('Informe a alternativa selecionada.');
    }

    const alternativa = questao.alternativas.find((a) => a.id === idAlternativaSelecionada);

    if (!alternativa) {
      throw new Error('Alternativa selecionada não pertence à questão.');
    }

    if (alternativa.correta !== correta) {
      throw new Error('O resultado informado não confere com a alternativa selecionada.');
    }
  }

  // =====================================================
  // TEMPO DE RESPOSTA
  // =====================================================

  private validarTempoResposta(tempoResposta: number): void {
    if (tempoResposta == null || tempoResposta < 0) {
      throw new Error('Informe o tempo de resposta.');
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
  // DATA DE RESPOSTA
  // =====================================================

  private validarRespondidaEm(respondidaEm: string): void {
    if (!respondidaEm?.trim() || Number.isNaN(new Date(respondidaEm).getTime())) {
      throw new Error('Informe a data de resposta.');
    }
  }
}
