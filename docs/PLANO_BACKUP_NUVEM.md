# Plano de Backup em Nuvem (Google Drive)

> Elaborado em 2026-08-11, a partir da análise do código-fonte atual.
> Escopo: adicionar backup versionado no Google Drive **sem introduzir backend**, mantendo a
> aplicação local-first e distribuível para outras pessoas.

---

## 1. Ponto de partida

A aplicação é hoje inteiramente client-side:

- Angular 21 standalone + PrimeNG, sem nenhuma chamada HTTP a API própria.
- Persistência em IndexedDB via Dexie, sobre uma infraestrutura própria estilo ORM
  (`core/database/` com decorators e schema builder, `core/repository/` com
  `BaseRepository` / `QueryBuilder` / `QueryExecutor`).
- Domínios: matéria, assunto, banca, questão, alternativa, histórico.
- Única garantia de durabilidade: `BackupService.export()` / `import()` — download e upload
  manual de um JSON, formato na `BACKUP_VERSION = 2`.
- Sem autenticação, sem nenhuma referência a Firebase/Supabase.

**Risco que este plano endereça:** os dados vivem apenas no IndexedDB daquele navegador.
Limpar dados do site, trocar de dispositivo ou sofrer eviction do navegador = perda total,
a menos que o usuário tenha exportado o JSON manualmente.

**Por que Drive e não um BaaS:** custo zero permanente (não depende de free tier que expira
ou pausa por inatividade), nenhum servidor para manter, e o dado fica na conta do próprio
usuário — o que, num app distribuído para terceiros, é também a melhor história de
privacidade possível: o autor do app nunca tem acesso aos dados de ninguém.

---

## 2. Decisões de arquitetura

### 2.1. Duas versões distintas, não confundir

| Conceito | Campo | Significado |
|---|---|---|
| Versão do **formato** | `BACKUP_VERSION` (hoje `2`) | Muda quando o schema do JSON muda. Já existe. |
| **Revisão** do backup | `revisao` (novo) | Contador monotônico, +1 a cada backup enviado à nuvem. |

São independentes. A revisão é o que permite responder "a nuvem está mais nova que eu?".

### 2.2. Layout no Drive

```
<pasta da aplicação no Drive do usuário>
├── manifest.json        ← pequeno; é o único arquivo lido na abertura do app
├── backup-0007.json     ← snapshots completos, um por revisão
├── backup-0006.json
└── backup-0005.json     ← mantém as N últimas (sugestão: 5); revisões antigas são apagadas
```

`manifest.json`:

```json
{
  "revisao": 7,
  "schemaVersao": 2,
  "exportadoEm": "2026-08-11T14:32:00.000Z",
  "dispositivoId": "a3f1c8e0-...",
  "dispositivoNome": "Notebook",
  "arquivoId": "1x9KdA...",
  "totais": { "materias": 12, "assuntos": 84, "bancas": 6, "questoes": 240, "historicos": 1180 }
}
```

Manter as N últimas revisões dá rollback de graça: o usuário pode restaurar uma revisão
anterior, não só a mais recente.

### 2.3. Estado local (localStorage)

Chaveado **por conta Google**, nunca global:

| Chave | Conteúdo |
|---|---|
| `questoes-concurso.sync.dispositivoId` | UUID do dispositivo, gerado uma vez (global, não por conta) |
| `questoes-concurso.sync.dispositivoNome` | Nome amigável, editável pelo usuário |
| `questoes-concurso.sync.contaAtual` | E-mail da conta conectada por último |
| `questoes-concurso.sync.<hashConta>.revisaoSincronizada` | Última revisão que este dispositivo enviou **ou** restaurou nessa conta |

O chaveamento por conta é obrigatório: ao trocar de conta o usuário está olhando para outro
Drive, com outra sequência de revisões. Comparar os números entre contas produz decisão errada
— tipicamente oferecer restaurar um backup vazio por cima de dados reais.

### 2.4. Escopos OAuth

| Escopo | Para quê | Classificação |
|---|---|---|
| `drive.file` | Ler/escrever **apenas os arquivos criados pelo próprio app** | Não-sensível |
| `openid`, `email`, `profile` | Exibir "conectado como fulano@gmail.com" e chavear o estado local | Não-sensíveis |

Evitar o escopo `drive` completo (sensível/restrito, exige processo de verificação longo).
Confirmar a classificação de cada escopo no Google Cloud Console no momento da configuração —
essa política já mudou no passado.

**Isolamento entre usuários sai de graça:** com `drive.file`, cada backup vai para o Drive
daquela conta. Não existe bucket compartilhado a particionar por `idUsuario` — o Google já
particionou. Nenhum usuário consegue ver os dados de outro nem que queira.

### 2.5. Login do Google = autenticação da aplicação

Não há tela de login própria, cadastro ou senha armazenada. O consentimento do Google, pedido
na primeira vez que o usuário aciona o backup na nuvem, cumpre esse papel.

O login é **opcional e sob demanda**: a aplicação deve continuar 100% funcional sem nunca
conectar a uma conta Google. Backup na nuvem é um recurso adicional, não um portão de entrada.

---

## 3. Fluxos

### 3.1. Enviar backup

1. Garantir token válido (pedir consentimento se for a primeira vez).
2. Ler `manifest.json` remoto.
3. Se `manifest.revisao > revisaoSincronizada` → **outro dispositivo subiu algo que este não tem**.
   Avisar antes de prosseguir, oferecendo: restaurar antes de enviar, ou sobrescrever
   assumindo a perda.
4. `novaRevisao = manifest.revisao + 1`; enviar `backup-000N.json`.
5. Atualizar `manifest.json` (idealmente com `If-Match` no ETag, para concorrência otimista).
6. Gravar `revisaoSincronizada = novaRevisao`.
7. Apagar revisões além das N mais recentes.

### 3.2. Verificar na abertura do app

1. Se houver token válido em cache (ou renovação silenciosa bem-sucedida), ler `manifest.json`.
2. Se a conta conectada for diferente de `contaAtual` → avisar troca de conta e **não** comparar revisões.
3. Se `manifest.revisao > revisaoSincronizada` → oferecer restauração, informando
   revisão local, revisão remota, data e dispositivo de origem.

### 3.3. Restaurar

1. Baixar o `arquivoId` do manifest (ou o de uma revisão anterior escolhida pelo usuário).
2. Passar pelo `BackupValidatorService` existente.
3. Importar via `ImportMode.REPLACE` — o caminho `mergeAll` **não** serve aqui (ver §6.2).
4. Gravar `revisaoSincronizada = revisao restaurada`.

---

## 4. Fases de implementação

### Fase 0 — Desacoplar "gerar backup" de "baixar arquivo"

Pré-requisito puro de refatoração, sem nada de Drive. Hoje `export()` monta o backup e dispara
o download no mesmo método, e `import()` só aceita um `File`.

- Tornar `buildBackup(): Promise<BackupData>` acessível (hoje é privado).
- Extrair `importarDeBackup(backup: BackupData, mode: ImportMode): Promise<MergeResult>`;
  `import(file, mode)` passa a ser um wrapper que lê o `File` e delega.
- Mover a criação do blob e do `<a download>` para um `FileDownloadService` em `shared/services/`.

**Ganho isolado:** o `BackupService` deixa de conhecer o DOM. Vale mesmo que o resto do plano
seja abandonado.

### Fase 1 — Versionar o formato de backup

- Adicionar a `BackupData`: `revisao?: number`, `dispositivoId?: string`, `dispositivoNome?: string`.
- Criar `DispositivoService` (`core/sync/`): gera e persiste o UUID, expõe o nome editável.
- `BackupValidatorService`: tratar campos ausentes em backups antigos (`revisao ?? 0`), no mesmo
  padrão do `normalizarVersaoLegada()` que já existe para `bancas`.
- **Não** subir `BACKUP_VERSION` para 3 — os campos são opcionais e retrocompatíveis. Só subir
  se a validação passar a exigi-los.

Ao fim desta fase o backup em arquivo já sai versionado, ainda sem Drive.

### Fase 2 — Camada de acesso ao Google Drive

Novos arquivos em `core/cloud/`:

| Arquivo | Responsabilidade |
|---|---|
| `google-auth.service.ts` | Carrega o Google Identity Services, solicita token, cacheia em memória, expõe `estaAutenticado()`, `signIn()`, `signOut()`, `contaConectada()` |
| `google-drive.client.ts` | `fetch` cru contra a REST API: `listarArquivos()`, `baixarConteudo(id)`, `criarArquivo()`, `atualizarArquivo()`, `apagar(id)` |
| `cloud-backup.service.ts` | Orquestra `BackupService` + `GoogleDriveClient`: manifest, revisões, poda de arquivos antigos |
| `sync-state.service.ts` | Leitura/escrita do estado local do §2.3, com chaveamento por conta |

Configuração no Google Cloud Console (uma vez):

- Criar projeto e ativar a **Google Drive API**.
- Criar **OAuth Client ID** do tipo *Web application*.
- Origens JavaScript autorizadas: `http://localhost:4200` e o domínio de produção.
- O `client_id` é público por design — pode ir versionado em `environment.ts`.

> O projeto ainda não tem `src/environments/`. Criar nesta fase.

### Fase 3 — UI em Configurações

Estender `backup-restauracao` (já tem estrutura de estado com signals e o padrão de
`ConfirmationService`):

- Bloco "Backup na nuvem": estado da conexão, conta conectada, botão conectar/desconectar.
- Data, revisão e dispositivo de origem do último backup remoto.
- Botão "Enviar para o Drive" ao lado do "Baixar backup" atual.
- Lista das últimas revisões disponíveis, com restauração de qualquer uma delas.
- Campo para nomear o dispositivo ("Notebook", "Celular") — é o que torna a mensagem de
  conflito compreensível.

### Fase 4 — Verificação na abertura

- Disparar `CloudBackupService.verificarAtualizacoes()` após o primeiro render (não em
  `APP_INITIALIZER` bloqueante — não vale atrasar o boot por uma chamada de rede).
- Havendo revisão remota maior, exibir banner ou `ConfirmDialog` do PrimeNG com a oferta de
  restauração e os números explícitos.
- **Fallback obrigatório:** se não houver token válido, não insistir em autenticar. Mostrar um
  botão discreto "verificar backup na nuvem" (ver §6.1).

### Fase 5 — Publicação para outras pessoas

Esta fase é o que diferencia "app pessoal" de "app distribuído". Nada aqui é código.

- **Tela de consentimento OAuth em modo Production.** Em *Testing* só entram contas cadastradas
  manualmente como usuários de teste, e há teto de usuários. Mantendo apenas os escopos
  não-sensíveis do §2.4, publicar em Production **não** exige o processo de verificação do Google
  (confirmar no console — a política muda).
- **Política de privacidade** com URL pública: é exigida para publicar. O conteúdo é
  favorável e simples de escrever: o app não coleta nem transmite dados para servidor algum; os
  dados ficam no navegador do usuário e, se ele optar, no Drive dele; o autor não tem acesso.
  Vale mencionar a base legal e o direito de exclusão (LGPD) — apagar é remover a pasta no Drive
  e limpar os dados do site.
- **Hospedagem estática gratuita** (GitHub Pages, Cloudflare Pages ou Netlify) com domínio
  estável — o domínio precisa ser fixo porque entra nas origens autorizadas do OAuth.
- **Nome e logo do app** na tela de consentimento: é o que o usuário vê ao autorizar. Um app sem
  nome reconhecível aumenta muito a taxa de desistência no consentimento.
- **Tratar recusa de consentimento** sem quebrar a aplicação: o usuário que clica "cancelar"
  deve continuar usando o app normalmente, só sem backup na nuvem.
- **Primeiro acesso:** como o app agora tem usuários que não são o autor, vale um estado vazio
  que explique o que fazer (criar matéria → assunto → questão) e ofereça conectar o Drive.

### Fase 6 — Automação (opcional, avaliar depois)

- Envio automático após operações relevantes, com *debounce* (no máximo 1 backup a cada X
  minutos), ou no `beforeunload`.
- Começar manual. Só automatizar se o backup manual se mostrar incômodo na prática.

---

## 5. Multiusuário: decisão explícita

Com a distribuição para terceiros, "cada pessoa com sua massa de dados" se resolve em duas
camadas — e elas têm status diferentes:

**Na nuvem: resolvido, sem código.** Cada pessoa autentica com a própria conta e os arquivos vão
para o Drive dela (§2.4). Isolamento total, garantido pelo Google.

**No dispositivo: resolvido na prática, com uma exceção.** O IndexedDB é por perfil de navegador.
Como cada pessoa usa o próprio dispositivo, cada uma naturalmente tem seu banco. A exceção é
**duas pessoas compartilhando o mesmo perfil de navegador** — nesse caso a segunda veria os dados
da primeira, independentemente de qual conta Google está conectada.

**Decisão: não tratar agora.** O tratamento completo (banco Dexie nomeado por conta, ou `idUsuario`
em toda entidade) atravessa a camada inteira de repositories e exige recarregar a aplicação ao
trocar de conta, já que a `AppDatabase` é injetada como singleton em `app.config.ts`. É
desproporcional frente a um cenário de uso improvável.

**Gatilho para revisitar:** relato real de dispositivo compartilhado, ou decisão de tornar o app
multiperfil (ex.: um usuário querendo separar "concurso A" e "concurso B"). Nesse caso, o caminho
mais barato é nomear o banco Dexie por conta via factory na injeção + `window.location.reload()`
na troca, **não** propagar `idUsuario` pelas entidades.

---

## 6. Limitações conhecidas

### 6.1. Token de acesso expira, e não há refresh token

OAuth em browser puro não fornece *refresh token*; o token de acesso vale cerca de uma hora. A
renovação silenciosa existe, mas depende de sessão ativa do Google e de cookies de terceiros,
cada vez mais restritos.

**Consequência:** a verificação automática da Fase 4 vai funcionar na maioria das vezes, não
sempre. O fallback manual não é um extra — é parte do desenho.

### 6.2. Snapshot não faz merge

Este desenho versiona *snapshots completos*. Se houver edição no dispositivo A e no B sem
sincronização entre as duas, uma das versões precisa ser descartada. Não existe "juntar as duas".

O `ImportMode.MERGE` atual **não** resolve isso: `mergeCollection()` filtra por
`idsExistentes` e só insere ids ainda inexistentes — edições concorrentes no mesmo registro são
ignoradas silenciosamente. Por isso a restauração da nuvem usa `REPLACE` (§3.3).

**Mitigação:** a UI precisa ser honesta. "A nuvem está na revisão 7, você está na 5; restaurar vai
substituir suas alterações locais" é uma mensagem aceitável. Vender isso como "sincronização"
não é.

**Quando isso deixar de bastar** (edição concorrente real entre dispositivos), o caminho é um BaaS
com sync por registro e timestamp — Supabase, com Postgres + Row Level Security, mantendo o app
local-first. Importante: **nada das Fases 0 e 1 se perde nesse caminho**; a separação entre montar
o backup e persisti-lo é exatamente o que aquela migração exigiria.

### 6.3. Login do Google não protege os dados locais

O consentimento autoriza acesso ao Drive; não protege o IndexedDB. Quem abrir o navegador vê os
dados no DevTools. Uma tela de login própria seria decorativa — sem backend, qualquer bloqueio de
acesso vive no cliente e é contornável. Proteção real exigiria criptografia local (senha derivando
a chave) ou backend de verdade. Não construir tela de login esperando segurança dela.

---

## 7. Checklist de execução

- [x] **Fase 0** — `buildBackup()` acessível; `importarDeBackup()` extraído; `FileDownloadService` criado
- [ ] **Fase 1** — `revisao`/`dispositivoId`/`dispositivoNome` em `BackupData`; `DispositivoService`; validator tolerante
- [ ] **Fase 2** — projeto no Google Cloud; Drive API ativada; OAuth Client ID; `src/environments/`; `core/cloud/` (4 serviços)
- [ ] **Fase 3** — bloco "Backup na nuvem" em `backup-restauracao`; lista de revisões; nome do dispositivo
- [ ] **Fase 4** — verificação pós-render; diálogo de restauração; fallback manual; detecção de troca de conta
- [ ] **Fase 5** — consentimento em Production; política de privacidade publicada; hospedagem com domínio fixo; nome/logo; estado vazio de primeiro acesso
- [ ] **Fase 6** — (opcional) envio automático com debounce

**Ordem recomendada:** Fases 0 e 1 são autocontidas, melhoram o código independentemente e não
dependem de nenhuma configuração externa — dá para começar por elas hoje, antes mesmo de decidir
em definitivo pelo Drive.
