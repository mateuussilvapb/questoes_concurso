//Angular
import { Injectable, inject } from '@angular/core';

//Aplicação
import { Materia } from '../../../materias/core/models/materia.model';
import { Assunto } from '../../../assuntos/core/models/assunto.model';
import { Banca } from '../../../bancas/core/models/banca.model';
import { Questao } from '../../../questoes/core/models/questao.model';
import { HistoricoQuestao } from '../../../historico/core/models/historico-questao.model';
import { MateriaService } from '../../../materias/core/services/materia.service';
import { AssuntoService } from '../../../assuntos/core/services/assunto.service';
import { BancaService } from '../../../bancas/core/services/banca.service';
import { QuestaoService } from '../../../questoes/core/services/questao.service';
import { HistoricoService } from '../../../historico/core/services/historico.service';
import { MateriaEntity } from '../../../../core/database/entities/materia-entity';
import { AssuntoEntity } from '../../../../core/database/entities/assunto-entity';
import { BancaEntity } from '../../../../core/database/entities/banca-entity';
import { QuestaoEntity } from '../../../../core/database/entities/questao-entity';
import { HistoricoEntity } from '../../../../core/database/entities/historico-entity';
import { PersistentEntity } from '../../../../core/database/entities/persistent-entity';
import { MateriaRepository } from '../../../../core/repository/repositories/materia-repository/materia.repository';
import { AssuntoRepository } from '../../../../core/repository/repositories/assunto-repository/assunto.repository';
import { BancaRepository } from '../../../../core/repository/repositories/banca-repository/banca.repository';
import { QuestaoRepository } from '../../../../core/repository/repositories/questao-repository/questao.repository';
import { HistoricoRepository } from '../../../../core/repository/repositories/historico-repository/historico.repository';
import { EntityRepository } from '../../../../core/repository/base/entity-repository';
import { BackupValidatorService } from './backup-validator.service';
import { BACKUP_VERSION } from '../../../../shared/types/types-const';
import { BackupData, ImportMode, ImportResult, MergeResult } from '../../../../core/storage/backup.models';
import { LoadingOverlayService } from '../../../../shared/services/loading-overlay.service';

@Injectable({
  providedIn: 'root',
})
export class BackupService {
  private readonly materiaService = inject(MateriaService);
  private readonly assuntoService = inject(AssuntoService);
  private readonly bancaService = inject(BancaService);
  private readonly questaoService = inject(QuestaoService);
  private readonly historicoService = inject(HistoricoService);

  private readonly materiaRepository = inject(MateriaRepository);
  private readonly assuntoRepository = inject(AssuntoRepository);
  private readonly bancaRepository = inject(BancaRepository);
  private readonly questaoRepository = inject(QuestaoRepository);
  private readonly historicoRepository = inject(HistoricoRepository);

  private readonly backupValidator = inject(BackupValidatorService);
  private readonly loadingOverlay = inject(LoadingOverlayService);

  async export(): Promise<void> {
    return this.loadingOverlay.wrap(async () => {
      const backup = await this.buildBackup();

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);

      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = this.generateFileName();

      anchor.click();

      URL.revokeObjectURL(url);
    });
  }

  async import(file: File, mode: ImportMode): Promise<MergeResult> {
    return this.loadingOverlay.wrap(async () => {
      const backupBruto = await this.readFile(file);
      const backup = this.normalizarVersaoLegada(backupBruto);

      this.backupValidator.validate(backup);

      return mode === ImportMode.REPLACE ? this.replaceAll(backup) : this.mergeAll(backup);
    });
  }

  async existAnyData(): Promise<boolean> {
    const [materias, assuntos, bancas, questoes, historicos] = await Promise.all([
      this.materiaRepository.count(),
      this.assuntoRepository.count(),
      this.bancaRepository.count(),
      this.questaoRepository.count(),
      this.historicoRepository.count(),
    ]);

    return materias + assuntos + bancas + questoes + historicos > 0;
  }

  // ======================================================
  // EXPORTAÇÃO
  // ======================================================

  private async buildBackup(): Promise<BackupData> {
    const [materias, assuntos, bancas, questoes, historicos] = await Promise.all([
      this.materiaService.listar(),
      this.assuntoService.listar(),
      this.bancaService.listar(),
      this.questaoService.listar(),
      this.historicoService.listar(),
    ]);

    return {
      versao: BACKUP_VERSION,
      exportadoEm: new Date().toISOString(),
      materias,
      assuntos,
      bancas,
      questoes,
      historicos,
    };
  }

  private generateFileName(): string {
    const date = new Date().toISOString().slice(0, 10);

    return `backup-${date}.json`;
  }

  // ======================================================
  // IMPORTAÇÃO
  // ======================================================

  private readFile(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          resolve(JSON.parse(reader.result as string));
        } catch {
          reject(new Error('Arquivo de backup inválido.'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Não foi possível ler o arquivo.'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Backups de versão 1 não tinham o campo `bancas` (o módulo de banca
   * foi criado depois, direto sobre Dexie). Preenchemos com um array
   * vazio para que o restante do fluxo (validação/importação) trate o
   * arquivo normalmente, sem precisar de um caminho especial por versão.
   */
  private normalizarVersaoLegada(backup: BackupData): BackupData {
    if (backup?.versao === 1) {
      return { ...backup, bancas: backup.bancas ?? [] };
    }

    return backup;
  }

  private async replaceAll(backup: BackupData): Promise<MergeResult> {
    await Promise.all([
      this.materiaRepository.clear(),
      this.assuntoRepository.clear(),
      this.bancaRepository.clear(),
      this.questaoRepository.clear(),
      this.historicoRepository.clear(),
    ]);

    await Promise.all([
      this.materiaRepository.saveAll(backup.materias.map((m) => this.toMateriaEntity(m))),
      this.assuntoRepository.saveAll(backup.assuntos.map((a) => this.toAssuntoEntity(a))),
      this.bancaRepository.saveAll(backup.bancas.map((b) => this.toBancaEntity(b))),
      this.questaoRepository.saveAll(backup.questoes.map((q) => this.toQuestaoEntity(q))),
      this.historicoRepository.saveAll(backup.historicos.map((h) => this.toHistoricoEntity(h))),
    ]);

    return {
      versaoOrigem: backup.versao,
      materias: { imported: backup.materias.length, ignored: 0 },
      assuntos: { imported: backup.assuntos.length, ignored: 0 },
      bancas: { imported: backup.bancas.length, ignored: 0 },
      questoes: { imported: backup.questoes.length, ignored: 0 },
      historicos: { imported: backup.historicos.length, ignored: 0 },
    };
  }

  private async mergeAll(backup: BackupData): Promise<MergeResult> {
    const [materias, assuntos, bancas, questoes, historicos] = await Promise.all([
      this.mergeCollection(this.materiaRepository, backup.materias, (m) => this.toMateriaEntity(m)),
      this.mergeCollection(this.assuntoRepository, backup.assuntos, (a) => this.toAssuntoEntity(a)),
      this.mergeCollection(this.bancaRepository, backup.bancas, (b) => this.toBancaEntity(b)),
      this.mergeCollection(this.questaoRepository, backup.questoes, (q) => this.toQuestaoEntity(q)),
      this.mergeCollection(this.historicoRepository, backup.historicos, (h) =>
        this.toHistoricoEntity(h),
      ),
    ]);

    return { versaoOrigem: backup.versao, materias, assuntos, bancas, questoes, historicos };
  }

  private async mergeCollection<M extends { id: string }, E extends PersistentEntity>(
    repository: EntityRepository<E>,
    imported: M[],
    toEntity: (item: M) => E,
  ): Promise<ImportResult> {
    const existentes = await repository.findAll();
    const idsExistentes = new Set(existentes.map((e) => e.id));

    const novos = imported.filter((item) => !idsExistentes.has(item.id));

    if (novos.length) {
      await repository.saveAll(novos.map(toEntity));
    }

    return {
      imported: novos.length,
      ignored: imported.length - novos.length,
    };
  }

  // ======================================================
  // MAPEAMENTO MODEL → ENTITY
  // ======================================================

  private toMateriaEntity(materia: Materia): MateriaEntity {
    const entidade = new MateriaEntity();

    entidade.id = materia.id;
    entidade.nome = materia.nome;
    entidade.descricao = materia.descricao;
    entidade.dataCriacao = new Date(materia.dataCriacao);
    entidade.dataAtualizacao = new Date(materia.dataAtualizacao ?? materia.dataCriacao);

    return entidade;
  }

  private toAssuntoEntity(assunto: Assunto): AssuntoEntity {
    const entidade = new AssuntoEntity();

    entidade.id = assunto.id;
    entidade.nome = assunto.nome;
    entidade.descricao = assunto.descricao;
    entidade.idMateria = assunto.idMateria;
    entidade.dataCriacao = new Date(assunto.dataCriacao);
    entidade.dataAtualizacao = new Date(assunto.dataAtualizacao ?? assunto.dataCriacao);

    return entidade;
  }

  private toBancaEntity(banca: Banca): BancaEntity {
    const entidade = new BancaEntity();

    entidade.id = banca.id;
    entidade.nome = banca.nome;
    entidade.descricao = banca.descricao;
    entidade.dataCriacao = new Date(banca.dataCriacao);
    entidade.dataAtualizacao = new Date(banca.dataAtualizacao ?? banca.dataCriacao);

    return entidade;
  }

  private toQuestaoEntity(questao: Questao): QuestaoEntity {
    const entidade = new QuestaoEntity();

    entidade.id = questao.id;
    entidade.enunciado = questao.enunciado;
    entidade.idMateria = questao.idMateria;
    entidade.idsAssuntos = [...questao.idsAssuntos];
    entidade.idBanca = questao.idBanca;
    entidade.nivelDificuldade = questao.nivelDificuldade;
    entidade.tipo = questao.tipo;
    entidade.alternativas = questao.alternativas;
    entidade.status = questao.status;
    entidade.observacao = questao.observacao;
    entidade.dataCriacao = new Date(questao.dataCriacao);
    entidade.dataAtualizacao = new Date(questao.dataAtualizacao ?? questao.dataCriacao);

    return entidade;
  }

  private toHistoricoEntity(historico: HistoricoQuestao): HistoricoEntity {
    const entidade = new HistoricoEntity();

    entidade.id = historico.id;
    entidade.idQuestao = historico.idQuestao;
    entidade.respondidaEm = historico.respondidaEm;
    entidade.idAlternativaSelecionada = historico.idAlternativaSelecionada;
    entidade.correta = historico.correta;
    entidade.tempoResposta = historico.tempoResposta;
    entidade.dificuldade = historico.dificuldade;
    entidade.idMateria = historico.idMateria;
    entidade.idsAssuntos = [...historico.idsAssuntos];
    entidade.dataCriacao = new Date(historico.dataCriacao);
    entidade.dataAtualizacao = new Date(historico.dataAtualizacao ?? historico.dataCriacao);

    return entidade;
  }
}
