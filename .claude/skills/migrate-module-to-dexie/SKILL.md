---
name: migrate-module-to-dexie
description: Analisa comparativamente um módulo de página (pages/<modulo>) contra a infraestrutura Dexie/IndexedDB já existente (core/database + core/repository) e migra o serviço legado (LocalStorage/StorageService) para o repository correspondente, preservando todas as regras de negócio. Use quando o usuário disser algo como "analise o módulo de X" ou "migre o módulo de X".
tools: Read, Glob, Grep, Bash, Edit, Write
---

# Migrar módulo de página para Dexie

Este projeto está migrando, módulo por módulo, de um mecanismo de persistência em
`LocalStorage` (`core/storage/storage.service.ts`) para `IndexedDB` via Dexie, usando uma
infraestrutura própria de entidades/decorators/repositories em `core/database/` e
`core/repository/`. Ver `MIGRATION_STATUS.md` na raiz do projeto para o estado geral da migração.

Esta skill cobre a migração de **um módulo por vez**. Ao ser invocada como "analise/migre o
módulo de `<nome>`", `<nome>` é o parâmetro (ex.: `materia`, `assunto`, `questao`, `historico`,
`banca`).

## Fase 1 — Levantamento do legado (`pages/<nome>/`)

Leia integralmente:

1. `pages/<nome>/core/models/<nome>.model.ts` — o shape de dados usado hoje pela UI.
2. `pages/<nome>/core/dtos/create-<nome>.dto.ts` e `update-<nome>.dto.ts`.
3. `pages/<nome>/core/services/<nome>.service.ts` — extraia **cada regra de negócio**:
   validações (obrigatoriedade, tamanho, duplicidade), normalizações (trim, lowercase),
   ordenações, checagens de integridade referencial antes de excluir, e todo método público
   (mesmo os aparentemente não usados — eles fazem parte do contrato).
4. Todo consumidor do serviço, dentro **e fora** do módulo. Rode:
   ```
   grep -rn "<Nome>Service" src/app --include=*.ts -l
   ```
   Para cada arquivo encontrado, leia o `.ts` e o `.html` correspondente e anote:
   - Quais métodos são chamados e como o retorno é usado (síncrono direto, em `computed()`,
     em binding de template, dentro de `try/catch`, etc.)
   - Se o resultado é usado diretamente em template (`[prop]="service.metodo(x)"`) — isso importa
     na Fase 4, porque um método assíncrono não pode ser chamado assim.

## Fase 2 — Levantamento da infraestrutura nova

1. `core/database/entities/<nome>-entity.ts` — compare campo a campo com o `model.ts` legado.
   Toda propriedade do model (exceto `id`/`dataCriacao`/`dataAtualizacao`, que vêm de
   `PersistentEntity`) deve existir na entity, com `@Index` quando usada em busca/filtro/FK,
   e `@Index({unique: true})` quando o legado impõe unicidade.
2. `core/repository/repositories/<nome>-repository/<nome>.repository.ts` — deve existir,
   `@Injectable({providedIn: 'root'})`, `extends BaseRepository<XEntity>`.
3. Métodos disponíveis em `BaseRepository`/`EntityRepository` (`core/repository/base/`) e no
   `QueryBuilder`/`QueryExecutor` (`core/repository/query/`) — são **todos assíncronos**
   (retornam `Promise`), ao contrário do `StorageService` legado, que é síncrono.

## Fase 3 — Relatório de comparação (apresentar antes de codar)

Produza uma tabela curta:

| Regra/campo do legado | Presente na infra nova? | Ação necessária |
|---|---|---|

Cubra: campos faltantes na entity, validações que precisam ser replicadas manualmente
(Dexie não valida regra de negócio, só unicidade de índice), checagens de integridade que
dependem de OUTROS módulos ainda não migrados (nesse caso, mantenha a leitura contra o
`StorageService`/`IntegrityService` legado até que o módulo dependente também migre — não
force a migração de um módulo que não foi pedido), e o `id`: `PersistentEntity` gera
`id`/`dataCriacao`/`dataAtualizacao` no construtor da entity — confirme que não há mais
`inject()` nesse caminho fora de contexto de injeção Angular (bug conhecido, já corrigido em
`persistent-entity.ts`; se reaparecer, é regressão).

## Fase 4 — Decisão sobre sync → async (bloqueante, perguntar ao usuário)

Dexie é inerentemente assíncrono. O `StorageService` legado é síncrono. Isso é uma decisão de
arquitetura, não um detalhe de implementação — **pergunte ao usuário** antes de codar, com
duas opções:

- **Cache em memória + `provideAppInitializer`**: o serviço migrado mantém um `signal` populado
  uma vez no bootstrap; leituras continuam síncronas para quem consome; menor raio de impacto
  (não precisa tocar módulos que ainda não foram chamados a migrar).
- **Cascata completa**: o serviço fica 100% assíncrono e todo consumidor (dentro e fora do
  módulo) é atualizado para `async/await`. Maior raio de impacto, mas sem meio-termo técnico
  (é o que este projeto adotou a partir da migração do módulo `materia`).

Se a cascata completa for escolhida (ou já for o padrão estabelecido no projeto — checar se
`LoadingOverlayService`/`app-loading-overlay` já existem em `shared/`), use-os: todo método
público assíncrono do serviço deve passar pelo `loadingOverlay.wrap(...)`, e todo `computed()`
ou binding de template que hoje lê o serviço de forma síncrona deve virar um `signal` pré-resolvido
(carregado uma vez, ex.: em `ngOnInit`, ou via `effect()` para inputs reativos), **nunca** uma
chamada assíncrona direta dentro de um binding de template.

## Fase 5 — Implementação

1. Reescreva `<nome>.service.ts`:
   - Injete `<Nome>Repository` no lugar de `StorageService`.
   - Todo método público retorna `Promise<T>`.
   - Construa entities com `new XEntity()` e atribua campos (não passe objeto literal — os
     defaults de `PersistentEntity` só rodam no construtor da classe).
   - Escreva um `mapToModel(entity) => Model` privado se os tipos de data divergirem
     (`Date` na entity vs. `string` no model legado) — não mude o model legado compartilhado
     por causa de um módulo só.
   - Preserve **exatamente** as mesmas mensagens de erro e mesma ordem de validação do
     serviço legado — são contrato de UX, não implementação incidental.
   - Mantenha checagens de integridade que dependem de módulos não migrados apontando para o
     `IntegrityService`/`StorageService` legado (eles continuam lendo dados reais enquanto
     esses módulos não migram).
2. Atualize cada consumidor listado na Fase 1:
   - `ngOnInit` vira `async ngOnInit(): Promise<void>` quando carrega dados do serviço migrado.
   - Métodos chamados em `try/catch` (criar/atualizar/remover) ganham `await`.
   - Bindings de template que chamavam o serviço diretamente por item de lista viram um
     `signal`/`Map` pré-carregado (carregado uma vez por listagem, não por item).
   - `computed()` que dependia de leitura síncrona vira `signal + effect()` (ou
     `toSignal`/`from(promise)`) quando o dado depende de um `input()` reativo.

## Fase 6 — Verificação

- Rode `ng build` (ou `tsc --noEmit`) — o compilador pega a maior parte dos pontos de
  chamada esquecidos (Promise não tratada como o tipo esperado).
- Rode `grep -rn "\.\(listar\|buscarPorId\|criar\|atualizar\|remover\)(" src/app` filtrando pelo
  serviço migrado para conferir que nenhuma chamada síncrona sobrou.
- Atualize `MIGRATION_STATUS.md`: marque o módulo como migrado na tabela da Prioridade 5, com
  data.
