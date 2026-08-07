# MIGRATION_STATUS.md

> Gerado em 2026-07-28, atualizado em 2026-08-06 — baseado exclusivamente na análise do código-fonte.

> **Nota de escopo — migração de `historico` (06/08):** este módulo foi migrado inteiramente na camada de infraestrutura/persistência (entity, repository, service, validator, `IntegrityService`), mas **não possui nenhum consumidor de UI hoje** — `resolver-questoes-page.ts` tem um TODO pendente para gravar o histórico ao concluir uma resolução, e `pages/estatisticas/` ainda não foi implementada. Ambos permanecem fora de escopo desta migração (são funcionalidades novas, não portabilidade de persistência) até serem pedidos explicitamente.

> **Nota de escopo — migração de backup/restauração (06/08):** `backup.service.ts` foi reescrito sobre os repositories Dexie. A pedido do usuário, o backup passou a incluir `bancas` (único domínio até então ausente do formato de backup), o que exigiu subir `BACKUP_VERSION` de 1 para 2. Com isso, `StorageService` e `StorageCollection` (legado LocalStorage) ficaram sem nenhum consumidor e foram removidos do projeto. Em seguida, a pedido do usuário, a **importação** de backups em versão 1 voltou a ser aceita: `BackupService.normalizarVersaoLegada()` preenche `bancas: []` antes da validação, `BackupValidatorService` aceita `versao === 1` como legado suportado, e a UI (`backup-restauracao.ts`) avisa o usuário quando o arquivo restaurado é de uma versão anterior sem bancas. A exportação continua sempre gerando `versao: 2`.

> **Nota de escopo — paginação da listagem de Questões (06/08):** com a persistência já migrada, o usuário levantou a preocupação de que a listagem de Questões cresce indefinidamente (volume alto ao longo do tempo) e hoje renderiza a coleção inteira de uma vez, sem paginador nem scroll virtualizado em lugar nenhum do projeto. Decisão tomada com o usuário: **paginar apenas a exibição** (não reescrever `QueryExecutor` para paginação nativa do Dexie — os filtros atuais de texto/flags não são index-friendly e exigiriam varredura completa de qualquer forma; ver item 🟢 22 abaixo, que **continua em aberto mas com prioridade baixa**, já que o problema prático — milhares de nós de DOM renderizados — está resolvido pela paginação de exibição). Escopo: só `questao-list-page` (Matéria/Assunto/Banca são coleções pequenas; Histórico não tem UI de listagem ainda). UX escolhida: **scroll infinito automático** via `IntersectionObserver` (novo `shared/directives/infinite-scroll-sentinel.directive.ts`), 20 itens por vez, reaproveitando o array já filtrado em memória — sem nova consulta ao Dexie a cada carga. Verificado ponta a ponta no navegador (incluindo import de um backup real com 240 questões) em 06/08.

---

## 1. Arquitetura encontrada

O projeto é uma aplicação Angular que vem construindo, em paralelo ao mecanismo legado de LocalStorage, uma infraestrutura própria para persistência com IndexedDB via Dexie, inspirada em ORMs como Hibernate/Entity Framework.

A infraestrutura nova está organizada dentro de `src/app/core/` em dois grandes módulos:

### `core/database/`

| Pasta / Arquivo | Responsabilidade |
|---|---|
| `storage/metadata-storage.ts` | Registro estático (Map) de todos os metadados de entidades e colunas |
| `metadata/entity-metadata.ts` | Interface que descreve uma entidade (target, table, columns) |
| `metadata/column-metadata.ts` | Interface que descreve uma coluna (PK, autoIncrement, indexed, unique, multiEntry) |
| `decorators/table.decorator.ts` | `@Table(name)` — registra o nome da tabela no MetadataStorage |
| `decorators/primary-key.decorator.ts` | `@PrimaryKey(autoIncrement?)` — marca a propriedade como PK |
| `decorators/index.decorator.ts` | `@Index({unique?, multiEntry?})` — marca a propriedade como índice |
| `interfaces/index-options.ts` | Opções do decorator `@Index` |
| `resolver/metadata-resolver.ts` | Resolve a hierarquia de herança via `Object.getPrototypeOf()` e agrega colunas |
| `registry/entity.registry.ts` | Importa todas as entities para forçar execução dos decorators |
| `builder/dexie-schema.builder.ts` | Gera o schema `Record<string, string>` esperado pelo Dexie |
| `app.database.ts` | `AppDatabase extends Dexie` — inicializada com o schema do Builder |
| `entities/persistent-entity.ts` | Classe base abstrata com `id`, `dataCriacao`, `dataAtualizacao` e `touch()` |
| `entities/materia-entity.ts` | `@Table('materia')` — campos: `nome` (unique), `descricao` |
| `entities/assunto-entity.ts` | `@Table('assunto')` — campos: `nome` (unique), `descricao` |
| `entities/questao-entity.ts` | `@Table('questao')` — campo: `enunciado` |
| `entities/alternativa-entity.ts` | `@Table('alternativa')` — campo: `texto` |
| `entities/banca-entity.ts` | `@Table('banca')` — campos: `nome` (unique), `descricao` |
| `entities/historico-entity.ts` | `@Table('historico')` — campos: `idQuestao`, `respondidaEm`, `idAlternativaSelecionada`, `correta`, `tempoResposta`, `dificuldade`, `idMateria`, `idsAssuntos` (`@Index({multiEntry:true})`) |

### `core/repository/`

| Pasta / Arquivo | Responsabilidade |
|---|---|
| `interfaces/repository-predicate.ts` | Type alias `(entity: T) => boolean` |
| `base/entity-repository.ts` | Interface com todos os métodos do contrato |
| `base/base-repository.ts` | Implementação genérica de todos os métodos usando `Table<T>` do Dexie |
| `query/query-operator.ts` | Enum com 11 operadores (EQUALS, NOT_EQUALS, BETWEEN, CONTAINS, etc.) |
| `query/query-logical-operator.ts` | Enum AND / OR |
| `query/query-condition.ts` | Interface de uma condição (property, operator, value, logicalOperator) |
| `query/query-order.ts` | Interface de ordenação (property, ascending) |
| `query/query-state.ts` | Estado completo de uma query (conditions, order, page, limit) |
| `query/query-builder.ts` | Builder fluente: `where/and/or/equals/notEquals/.../orderBy/asc/desc/page/limit/build()` |
| `query/query-executor.ts` | Executa um `QueryState` contra a `Table` do Dexie (índices + filter em memória) |
| `repositories/materia-repository/materia.repository.ts` | Único repository concreto implementado |

### Legado (LocalStorage) — `core/storage/`

| Arquivo | Responsabilidade |
|---|---|
| `storage.service.ts` | CRUD completo sobre `localStorage` — ainda em uso ativo por toda a aplicação |
| `storage.constants.ts` | Enum `StorageCollection` com 4 coleções (MATERIAS, ASSUNTOS, QUESTOES, HISTORICOS) |
| `backup.models.ts` | Tipos de backup/importação |
| `id-generator/` | Serviço de geração de IDs (compartilhado entre legado e nova infra) |
| `integrity/` | Serviço de integridade referencial baseado em LocalStorage |

---

## 2. Componentes implementados

### Infraestrutura Dexie

| Componente | Status |
|---|---|
| `MetadataStorage` | ✅ Completo |
| `EntityMetadata` / `ColumnMetadata` | ✅ Completo |
| `@Table` decorator | ✅ Completo |
| `@PrimaryKey` decorator | ✅ Completo |
| `@Index` decorator | ✅ Completo |
| `MetadataResolver` (herança) | ✅ Completo |
| `EntityRegistry` | ✅ Completo |
| `DexieSchemaBuilder` | ✅ Completo |
| `AppDatabase` | ✅ Completo |
| `PersistentEntity` | ✅ Completo |
| `MateriaEntity` | ✅ Completo |
| `AssuntoEntity` | ✅ Completo |
| `BancaEntity` | ✅ Completo |
| `QuestaoEntity` | ✅ Completo (FKs `idAssunto`, `idBanca` indexadas) |
| `AlternativaEntity` | ✅ Completo (FK `idQuestao`, `correta` indexada, `ordem` adicionado) |
| `HistoricoEntity` | ✅ Completo (`idQuestao`, `respondidaEm`, `correta`, `dificuldade`, `idMateria`, `idsAssuntos` indexados; `idAlternativaSelecionada`/`tempoResposta` não indexados) |
| `EntityRepository` (interface) | ✅ Completo |
| `BaseRepository` | ✅ Completo |
| `QueryOperator` / `QueryLogicalOperator` | ✅ Completo |
| `QueryCondition` / `QueryOrder` / `QueryState` | ✅ Completo |
| `QueryBuilder` (construção de estado) | ✅ Completo |
| `QueryBuilder` (métodos de execução) | ✅ Completo (`list`, `first`, `last`, `count`, `exists` delegam ao `QueryExecutor`) |
| `QueryExecutor` | ✅ Completo |
| `MateriaRepository` | ✅ Completo |

### Repositories concretos

| Repository | Status |
|---|---|
| `AssuntoRepository` | ✅ Completo (`@Injectable`, `inject(AppDatabase)`) |
| `QuestaoRepository` | ✅ Completo — legado ainda existe em `pages/questoes/core/repositories/questao-repository.ts` e segue em uso |
| `AlternativaRepository` | ✅ Completo |
| `BancaRepository` | ✅ Completo |
| `HistoricoRepository` | ✅ Completo — legado (`pages/historico/core/repositories/historico-repository.ts`) removido em 06/08 |

> Todas as entidades, o query engine e os 6 repositories concretos (Prioridades 1–4 do plano original) estão implementados. O trabalho restante é inteiramente de **migração dos serviços de página** para consumi-los (Prioridade 5 em diante).

---

## 3. Componentes pendentes

> Ordenados por dependência/prioridade.

### ~~Prioridade 1 — Completar entidades faltantes~~ ✅ Concluída em 06/08

### ~~Prioridade 2 — Conectar QueryBuilder ao QueryExecutor~~ ✅ Concluída em 06/08

### ~~Prioridade 3 — Repositories concretos restantes~~ ✅ Concluída em 06/08

### ~~Prioridade 4 — Injeção de dependência Angular para os repositories~~ ✅ Concluída em 06/08

### Prioridade 5 — Migrar serviços das páginas (LocalStorage → IndexedDB)

Os seguintes arquivos ainda usam `StorageService` (LocalStorage) e precisam ser migrados:

> **Estratégia async adotada (definida ao migrar `materia`):** Dexie é assíncrono; o legado é síncrono. Optou-se por **cascata completa** — o serviço migrado fica 100% `Promise`-based e todo consumidor (dentro e fora do módulo) é atualizado para `async/await`, em vez de manter uma fachada síncrona via cache. Todo método público desses serviços passa por `LoadingOverlayService.wrap(...)` (`shared/services/loading-overlay.service.ts`), que exibe `<app-loading-overlay />` (montado uma vez em `app.html`) enquanto a operação está pendente. Esse é o padrão a repetir nas próximas migrações, a menos que decidido o contrário.

| Arquivo a migrar | Substituto | Status em 06/08 |
|---|---|---|
| `pages/materias/core/services/materia.service.ts` | `MateriaRepository` | ✅ Migrado — 100% assíncrono, com `LoadingOverlayService`. Consumidores atualizados em `materias/*`, `assuntos-list-page.ts`, `assuntos-form-page.ts`, `questao-list-page.ts`, `questao-form-page.ts`, `resolver-questao-card.ts` (9 pontos de chamada) |
| `pages/bancas/core/services/banca.service.ts` | `BancaRepository` | ✅ Módulo novo, criado direto sobre Dexie em 06/08 (CRUD nome+descrição, igual a `materia`); nunca existiu em `StorageService` |
| `pages/assuntos/core/services/assunto.service.ts` | `AssuntoRepository` | ✅ Migrado — 100% assíncrono, com `LoadingOverlayService`. `AssuntoEntity` ganhou o campo `idMateria` (ausente até então). Consumidores atualizados em `assuntos/*`, `materias-list-page.ts`, `questao-form-page.ts`, `questao-list-page.ts`, `multiselect-assunto.ts`, `autocomplete-assunto.ts` (chamadas por item de lista viraram `Map` pré-carregado) |
| `pages/questoes/core/repositories/questao-repository.ts` | `QuestaoRepository` | ✅ Migrado — arquivo legado removido; `questao.service.ts` 100% assíncrono, com `LoadingOverlayService`. `QuestaoEntity` completada (`idMateria`, `idsAssuntos` com `@Index({multiEntry:true})`, `idBanca?`, `nivelDificuldade`, `tipo`, `alternativas`, `status`, `observacao` — antes só tinha `enunciado` + FKs singulares erradas). Consumidores atualizados: `questao-form-page.ts`, `questao-card-presentation.ts`, `questao-list-page.ts`/`resolver-questoes-page.ts` (computed síncrono → `signal`+`effect()`), `materias-list-page.ts`/`assuntos-list-page.ts`/`bancas-list-page.ts` (chamadas por item de lista → `Map` pré-carregado) |
| `pages/historico/core/repositories/historico-repository.ts` | `HistoricoRepository` | ✅ Migrado — arquivo legado removido em 06/08 |
| `pages/questoes/core/services/questao-validator.service.ts` | Adaptar a queries Dexie | ✅ Migrado (junto da correção do bug de criação de questão em 06/08) — valida matéria/assunto/banca via `MateriaRepository`/`AssuntoRepository`/`BancaRepository` (Dexie) |
| `pages/historico/core/services/historico-validator.service.ts` | Adaptar a queries Dexie | ✅ Migrado em 06/08 — reescrito do zero (o rascunho anterior estava inteiramente comentado); valida questão/matéria/assuntos/alternativa selecionada via `QuestaoRepository`/`MateriaRepository`/`AssuntoRepository` (Dexie) |
| `pages/historico/core/services/historico.service.ts` | `HistoricoRepository` | ✅ Migrado em 06/08 — reescrito do zero, 100% assíncrono, com `LoadingOverlayService`. Sem consumidores de UI ainda (ver nota de escopo no topo do documento) |
| `pages/configuracoes/core/services/backup.service.ts` | Nova camada de backup via Dexie | ✅ Migrado em 06/08 — reescrito do zero, 100% assíncrono, com `LoadingOverlayService`. Exporta/importa via `MateriaRepository`/`AssuntoRepository`/`BancaRepository`/`QuestaoRepository`/`HistoricoRepository`; leitura de exportação reaproveita os `*.service.ts` já migrados (`listar()`), escrita de importação mapeia Model→Entity preservando `id`/`dataCriacao`/`dataAtualizacao` originais. `BackupData` ganhou o campo `bancas` (decisão do usuário — único domínio que ainda faltava no backup) e `BACKUP_VERSION` foi de 1 para 2 |
| `pages/configuracoes/components/backup-restauracao/backup-restauracao.ts` | Via `backup.service` novo | ✅ Migrado em 06/08 — `backup()`/`confirmAndImport()` assíncronos, `existAnyData()` (antes em `StorageService`) movido para `BackupService` |
| `core/storage/integrity/integrity.service.ts` | Adaptar verificações a queries Dexie | ✅ Migrado em 06/08 — todas as verificações (matéria/assunto/banca/questão/histórico) agora usam os repositories Dexie; `StorageService` não é mais importado neste arquivo |

> `materia`, `assunto`, `questao`, `historico` e o backup estão migrados (100% assíncrono + `LoadingOverlayService`). `banca` é um módulo novo, criado direto sobre Dexie (nunca existiu em `StorageService`). Todos os módulos de página e o backup/restauração estão migrados; resta apenas a limpeza final do legado (Prioridade 7).

### ~~Prioridade 6 — Backup/Exportação~~ ✅ Concluída em 06/08

- [x] Implementar exportação de dados a partir do IndexedDB (substituto do `exportBackup()`)
- [x] Implementar importação com merge a partir do IndexedDB

### Prioridade 7 — Limpeza do legado

- [x] Remover `StorageService` — arquivo deletado em 06/08 (`core/storage/storage.service.ts`); não havia mais nenhum consumidor
- [x] Remover `StorageCollection` enum — arquivo deletado em 06/08 (`core/storage/storage.constants.ts`)
- [x] `backup.models.ts` — mantido (ainda é o contrato de tipos do backup, agora consumido só pela infra Dexie); não havia nada de legado a remover além do `StorageService` que o usava
- [x] `integrity.service.ts` — já era 100% Dexie desde a migração de `historico` (06/08); não existe versão legada paralela

---

## 4. Problemas encontrados

### 🔴 Críticos

| # | Problema | Local |
|---|---|---|
| ~~1~~ | ~~`QueryBuilder.list/first/last/count/exists` lançam `Error`~~ | ✅ Resolvido em 06/08 |
| ~~2~~ | ~~`HistoricoEntity` sem campos de domínio~~ | ✅ Resolvido em 06/08 |
| ~~3~~ | ~~`QuestaoEntity` sem FKs~~ | ✅ Resolvido em 06/08 |
| ~~4~~ | ~~`AlternativaEntity` sem FK `idQuestao` e sem campo `correta`~~ | ✅ Resolvido em 06/08 |
| ~~6~~ | ~~`PersistentEntity` chamava `inject(IdGeneratorService)` em field initializer, fora de contexto de injeção Angular — `new XEntity()` fora de um construtor gerenciado pelo DI lançava `NG0203`~~ | ✅ Resolvido em 06/08 ao migrar `materia` — `id` agora gerado com `crypto.randomUUID()` direto, sem `inject()` |
| ~~15~~ | ~~`historico.service.ts` e `historico-validator.service.ts` foram adicionados inteiramente comentados, com referências a tipos/serviços que não existem no domínio de histórico (código copiado de `questoes` sem adaptar)~~ | ✅ Resolvido em 06/08 — ambos reescritos do zero |
| ~~16~~ | ~~`BaseRepository.findAll/findById/findByPredicate/...` retornavam os registros crus do Dexie (structured clone), sem a prototype chain da entidade — qualquer chamada a um método de instância (ex.: `entidade.touch()`) lançava `TypeError: entidade.touch is not a function`. Afetava **todo** `atualizar()` de todo módulo migrado (`materia`, `assunto`, `banca`, `questao`) — só não havia sido percebido porque o fluxo de edição não tinha sido testado ponta a ponta após a migração de `materia`~~ | ✅ Resolvido em 06/08 ao migrar `questao` — `BaseRepository` reanexa o prototype (`Object.setPrototypeOf`) em toda leitura, sem reexecutar o construtor |

### 🟡 Moderados

| # | Problema | Local |
|---|---|---|
| ~~5~~ | ~~Apenas `MateriaRepository` existe~~ | ✅ Resolvido em 06/08 — os 6 repositories concretos existem |
| ~~6~~ | ~~`PersistentEntity` usa `inject(IdGeneratorService)` diretamente~~ | ✅ Resolvido em 06/08 — movido para 🔴 Críticos acima (era bloqueante, não só um risco) |
| 7 | `BaseRepository` recebe `entityType: Function` e usa `MetadataResolver.resolve()`, mas o `MetadataResolver.resolve` lê colunas não resolvidas do `MetadataStorage` (sem herança) no `executeConditions` do `QueryExecutor` | `query/query-executor.ts` L70 |
| 8 | `QueryExecutor` usa `metadata.columns` sem resolver hierarquia — pode não encontrar colunas herdadas de `PersistentEntity` | `query/query-executor.ts` L70 |
| ~~9~~ | ~~Toda a aplicação ainda usa `StorageService`~~ | ✅ Resolvido em 06/08 — `StorageService`/`StorageCollection` removidos; todas as páginas e o backup consomem os repositories Dexie |
| 10 | `EntityRegistry` exporta array `ENTITY_REGISTRY` mas `app.database.ts` apenas o importa como side-effect (`import './registry/entity.registry'`) — o array não é consumido, apenas o efeito colateral dos decorators | `registry/entity.registry.ts` |

### 🟢 Menores

| # | Problema | Local |
|---|---|---|
| 11 | `startsWith`/`endsWith` no `QueryExecutor` fazem `.toLowerCase()` mas o `QueryBuilder` não documenta isso — comportamento implícito | `query/query-executor.ts` L190-203 |
| 12 | Paginação do `QueryExecutor` em memória (slice) — carrega todos os dados antes de paginar, ineficiente para volumes grandes | `query/query-executor.ts` L29-36 |
| 13 | `BaseRepository.updateAll` usa `Promise.all(ids.map(...))` — sem transação Dexie, pode falhar parcialmente | `base/base-repository.ts` L97-99 |
| 14 | `orOperador` no `QueryExecutor.matchesConditions` aplica AND/OR de forma simplificada (não trata grupos de OR) | `query/query-executor.ts` L111-133 |

---

## 5. Plano de conclusão

> Cada item depende apenas dos anteriores.

```
[x] 1. Completar HistoricoEntity                                   (concluído 06/08)
[x] 2. Completar QuestaoEntity                                     (concluído 06/08)
[x] 3. Completar AlternativaEntity                                 (concluído 06/08)
[x] 4. Conectar QueryBuilder ao QueryExecutor                      (concluído 06/08)
[x] 5. Criar AssuntoRepository                                     (concluído 06/08)
[x] 6. Criar QuestaoRepository                                     (concluído 06/08)
[x] 7. Criar AlternativaRepository                                 (concluído 06/08)
[x] 8. Criar BancaRepository                                       (concluído 06/08)
[x] 9. Criar HistoricoRepository                                   (concluído 06/08)
[x] 10. Tornar todos os repositories @Injectable / providos        (concluído 06/08)

[x] 11. Migrar materia.service.ts → MateriaRepository            (concluído 06/08 — cascata async)

[x] 12. Migrar assunto.service.ts → AssuntoRepository                (concluído 06/08 — cascata async)

[x] 13. Migrar questao-repository.ts (legado) → QuestaoRepository        (concluído 06/08 — cascata async)

[x] 14. Migrar historico-repository.ts (legado) → HistoricoRepository   (concluído 06/08 — cascata async)

[x] 14b. Reescrever historico.service.ts / historico-validator.service.ts
          do zero (o rascunho anterior estava inteiramente comentado)     (concluído 06/08)

[x] 15. Migrar questao-validator.service.ts → queries Dexie              (concluído 06/08)

[x] 16. Migrar historico-validator.service.ts → queries Dexie            (concluído 06/08)

[x] 17. Implementar backup.service.ts baseado em Dexie
         (exportar e importar via transaction)                          (concluído 06/08 — inclui `bancas` no backup, BACKUP_VERSION 1→2)

[x] 18. Migrar backup-restauracao.ts para o novo backup.service          (concluído 06/08)

[x] 19. Migrar integrity.service.ts → queries Dexie                      (concluído 06/08 — todas as verificações, incluindo históricos)

[x] 20. Remover StorageService, StorageCollection e legado               (concluído 06/08 — ambos os arquivos deletados; sem consumidores restantes)

[x] 21. Verificar e ajustar injeção de IdGeneratorService em PersistentEntity
         (garantir compatibilidade com contexto de injeção Angular)      (já resolvido ao migrar `materia` — `id` gerado via `crypto.randomUUID()`, sem `inject()`)

[ ] 22. Revisar paginação do QueryExecutor para usar `.offset().limit()` nativo do Dexie
         (atualmente carrega tudo em memória antes de paginar)

[ ] 23. Revisar updateAll para usar transação Dexie (db.transaction())
```

**Próximo passo recomendado:** todos os módulos de página (`materia`, `assunto`, `banca`, `questao`, `historico`) e o backup/restauração estão migrados; o `StorageService` legado foi removido do projeto. Resta apenas os itens 🟢 menores (22-23), que são refinamentos de performance/robustez sem urgência, e a decisão em aberto sobre `historico`: foi migrado sem UI consumidora — se o próximo passo desejado for wiring de UI em vez de infraestrutura, avaliar primeiro o TODO em `resolver-questoes-page.ts` e a página `pages/estatisticas/`.

> Existe agora uma skill reutilizável para conduzir essas migrações módulo a módulo:
> `.claude/skills/migrate-module-to-dexie/SKILL.md`. Invocar como "analise/migre o módulo de assunto" (ou questao/historico/banca).

---

## 6. Restrições respeitadas

- A arquitetura de decorators + MetadataStorage + MetadataResolver + DexieSchemaBuilder é mantida integralmente.
- Não foi proposta nenhuma substituição de biblioteca nem simplificação para `Table<T>` direto.
- Todos os pontos pendentes são aditivos ou corretivos dentro do modelo arquitetural existente.
- O Dexie continua sendo a única dependência de storage de baixo nível.
