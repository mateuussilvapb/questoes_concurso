# MIGRATION_STATUS.md

> Gerado em 2026-07-28, atualizado em 2026-08-06 — baseado exclusivamente na análise do código-fonte.

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
| `entities/historico-entity.ts` | `@Table('historico')` — apenas herda `PersistentEntity` (sem campos próprios) |

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
| `HistoricoEntity` | ✅ Completo (`idQuestao`, `acertou`, `dataResolucao`, todos indexados) |
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
| `HistoricoRepository` | ✅ Completo — legado ainda existe em `pages/historico/core/repositories/historico-repository.ts` e segue em uso |

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
| `pages/assuntos/core/services/assunto.service.ts` | `AssuntoRepository` | ✅ Migrado — 100% assíncrono, com `LoadingOverlayService`. `AssuntoEntity` ganhou o campo `idMateria` (ausente até então). Consumidores atualizados em `assuntos/*`, `materias-list-page.ts`, `questao-form-page.ts`, `questao-list-page.ts`, `multiselect-assunto.ts`, `autocomplete-assunto.ts` (chamadas por item de lista viraram `Map` pré-carregado) |
| `pages/questoes/core/repositories/questao-repository.ts` | `QuestaoRepository` | ❌ Ainda usa `StorageService` |
| `pages/historico/core/repositories/historico-repository.ts` | `HistoricoRepository` | ❌ Ainda usa `StorageService` |
| `pages/questoes/core/services/questao-validator.service.ts` | Adaptar a queries Dexie | ❌ Ainda usa `StorageService` |
| `pages/historico/core/services/historico-validator.service.ts` | Adaptar a queries Dexie | 🔴 Rascunho novo adicionado, mas **inteiramente comentado**; código incompleto/inconsistente (tipos não importados: `Materia`, `Assunto`, `HistoricoQuestao`, `UpdateHistoricoQuestao`) |
| `pages/historico/core/services/historico.service.ts` | `HistoricoRepository` | 🔴 Arquivo novo adicionado, mas **inteiramente comentado** — cópia do módulo `questoes` (classe ainda chamada `QuestaoService`, referencia `Alternativa`/`TipoQuestao`/`AlternativasFactoryService`, que não pertencem ao domínio de histórico) |
| `pages/configuracoes/core/services/backup.service.ts` | Nova camada de backup via Dexie | ❌ Ainda usa `StorageService` |
| `pages/configuracoes/components/backup-restauracao/backup-restauracao.ts` | Via `backup.service` novo | ❌ Ainda usa `StorageService` |
| `core/storage/integrity/integrity.service.ts` | Adaptar verificações a queries Dexie | ❌ Ainda usa `StorageService` |

> Nenhuma página foi de fato migrada ainda. O trabalho em `historico` iniciado em 06/08 criou DTOs (`create-historico.dto.ts`, `update-historico.dto.ts`) e dois arquivos de serviço, mas ambos os serviços estão comentados por inteiro e não compilam — tratar como rascunho, não como progresso funcional.

### Prioridade 6 — Backup/Exportação

- [ ] Implementar exportação de dados a partir do IndexedDB (substituto do `exportBackup()`)
- [ ] Implementar importação com merge a partir do IndexedDB

### Prioridade 7 — Limpeza do legado

- [ ] Remover `StorageService` após todas as migrações
- [ ] Remover `StorageCollection` enum
- [ ] Remover `backup.models.ts` legado (ou adaptar)
- [ ] Remover `integrity.service.ts` legado (ou adaptar)

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
| 15 | `historico.service.ts` e `historico-validator.service.ts` foram adicionados inteiramente comentados, com referências a tipos/serviços que não existem no domínio de histórico (código copiado de `questoes` sem adaptar) — se descomentados como estão, não compilam | `pages/historico/core/services/historico.service.ts`, `historico-validator.service.ts` |

### 🟡 Moderados

| # | Problema | Local |
|---|---|---|
| ~~5~~ | ~~Apenas `MateriaRepository` existe~~ | ✅ Resolvido em 06/08 — os 6 repositories concretos existem |
| ~~6~~ | ~~`PersistentEntity` usa `inject(IdGeneratorService)` diretamente~~ | ✅ Resolvido em 06/08 — movido para 🔴 Críticos acima (era bloqueante, não só um risco) |
| 7 | `BaseRepository` recebe `entityType: Function` e usa `MetadataResolver.resolve()`, mas o `MetadataResolver.resolve` lê colunas não resolvidas do `MetadataStorage` (sem herança) no `executeConditions` do `QueryExecutor` | `query/query-executor.ts` L70 |
| 8 | `QueryExecutor` usa `metadata.columns` sem resolver hierarquia — pode não encontrar colunas herdadas de `PersistentEntity` | `query/query-executor.ts` L70 |
| 9 | Toda a aplicação ainda usa `StorageService` — as duas infraestruturas convivem sem plano de transição definido. Os repositories Dexie estão prontos, mas nenhuma página foi migrada para consumi-los | `core/storage/`, `pages/` |
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

[ ] 13. Migrar questao-repository.ts (legado) → QuestaoRepository

[ ] 14. Migrar historico-repository.ts (legado) → HistoricoRepository

[ ] 14b. Finalizar ou descartar o rascunho atual de historico.service.ts /
          historico-validator.service.ts — hoje estão inteiramente comentados
          e com referências a tipos que não existem no domínio de histórico
          (código copiado de questoes sem adaptar)

[ ] 15. Migrar questao-validator.service.ts → queries Dexie

[ ] 16. Migrar historico-validator.service.ts → queries Dexie

[ ] 17. Implementar backup.service.ts baseado em Dexie
         (exportar e importar via transaction)

[ ] 18. Migrar backup-restauracao.ts para o novo backup.service

[ ] 19. Migrar integrity.service.ts → queries Dexie

[ ] 20. Remover StorageService, StorageCollection e legado

[ ] 21. Verificar e ajustar injeção de IdGeneratorService em PersistentEntity
         (garantir compatibilidade com contexto de injeção Angular)

[ ] 22. Revisar paginação do QueryExecutor para usar `.offset().limit()` nativo do Dexie
         (atualmente carrega tudo em memória antes de paginar)

[ ] 23. Revisar updateAll para usar transação Dexie (db.transaction())
```

**Próximo passo recomendado:** item 13 (`questao-repository.ts` legado → `QuestaoRepository`), seguindo o mesmo padrão estabelecido em `materia.service.ts`/`assunto.service.ts` (100% assíncrono + `LoadingOverlayService`).

> Existe agora uma skill reutilizável para conduzir essas migrações módulo a módulo:
> `.claude/skills/migrate-module-to-dexie/SKILL.md`. Invocar como "analise/migre o módulo de assunto" (ou questao/historico/banca).

---

## 6. Restrições respeitadas

- A arquitetura de decorators + MetadataStorage + MetadataResolver + DexieSchemaBuilder é mantida integralmente.
- Não foi proposta nenhuma substituição de biblioteca nem simplificação para `Table<T>` direto.
- Todos os pontos pendentes são aditivos ou corretivos dentro do modelo arquitetural existente.
- O Dexie continua sendo a única dependência de storage de baixo nível.
