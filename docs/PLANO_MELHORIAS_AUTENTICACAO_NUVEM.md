# Plano de Melhorias — Autenticação e Sincronização com o Google Drive

> Documento **autocontido**: pode ser lido e executado sem conhecer o histórico do
> projeto nem o `docs/PLANO_BACKUP_NUVEM.md`. Referências ao plano original são
> apenas informativas.

---

## 1. Contexto (o que existe hoje)

A aplicação é um Angular 20 (standalone components, signals, PrimeNG + preset
próprio) que guarda os dados localmente em IndexedDB (Dexie) e oferece **backup
versionado no Google Drive** do próprio usuário, sem backend.

Arquivos relevantes:

| Arquivo | Papel |
| --- | --- |
| `src/app/core/cloud/google-auth.service.ts` | OAuth via Google Identity Services (GIS) "token client". Token só em memória. |
| `src/app/core/cloud/google-drive.client.ts` | Chamadas REST ao Drive (listar/criar/atualizar/baixar/apagar). |
| `src/app/core/cloud/cloud-backup.service.ts` | Orquestra envio/restauração/verificação de revisões (`manifest.json` + `backup-000N.json`). |
| `src/app/core/sync/sync-state.service.ts` | Estado local de sincronização em `localStorage` (conta atual + revisão sincronizada por conta). |
| `src/app/app.ts` / `src/app/app.html` | Faz a verificação de nuvem na abertura e exibe o botão flutuante "Verificar backup na nuvem". |
| `src/app/pages/configuracoes/components/backup-restauracao/` | Tela **Backup e Restauração** (exportar, importar, bloco "Backup na nuvem" com Conectar/Enviar/Restaurar). |
| `src/app/core/config/providers/primeng.provider.ts` | Preset PrimeNG (paleta índigo). |
| `src/assets/scss/utils/_variables.scss` | `$gradientStartColor #4F46E5`, `$gradientMidColor #7C3AED`, `$gradientLastColor #C026D3`, `$gradientApplication`. |
| `src/assets/scss/primeNG/_button.scss` | Classe `.button-aplicacao-style` (gradiente da identidade visual). |
| `src/environments/environment.ts` | `google.clientId` (público, versionado). |

Comportamento atual, resumido:

1. `App` (raiz) chama, em `afterNextRender`, `CloudBackupService.verificarAtualizacoes()`.
2. Isso chama `GoogleAuthService.obterAccessToken()`, que — não havendo token em
   memória — dispara `requestAccessToken({ prompt: '' })` do GIS.
3. O GIS abre a janela de autorização do Google **já na abertura do app**.
4. Se falhar, `App` exibe um botão flutuante "Verificar backup na nuvem" que chama
   `signIn()` (consentimento explícito) e refaz a verificação.

---

## 2. Problemas a resolver

| # | Problema relatado | Causa raiz |
| --- | --- | --- |
| P1 | O app pede login logo na abertura. | `App` dispara `verificarAtualizacoes()` → `obterAccessToken()` → `requestAccessToken` sem nenhuma condição prévia. Quando não há grant/sessão reutilizável, o GIS abre a janela do Google. |
| P2 | O login deveria ser pedido só em "Conectar ao Google Drive". | Não há flag que distinga "usuário já autorizou este app neste navegador" de "nunca autorizou". |
| P3 | Aparece sempre a tela "O Google não verificou este app". | O projeto no Google Cloud está com **publishing status = Testing**. Isso é configuração do Console, não código. |
| P4 | Após F5 o login é pedido de novo. | O access token vive só em memória (correto), e não há tentativa **silenciosa** de reobtê-lo condicionada a um consentimento anterior. |
| P5 | "Verificar backup na nuvem" tem nome/estilo inadequados. | Botão `[text]="true"`, severity secondary, sem fundo; e o nome não descreve bem a ação. |

### 2.1. Confirmação sobre o botão "Verificar backup na nuvem" (P5)

**Não é uma sincronização.** Hoje o fluxo (`App.verificarNuvemManualmente` →
`CloudBackupService.verificarAtualizacoes`) é **unidirecional, só de leitura**:

- autentica (hoje com `signIn()`, ou seja, consentimento explícito);
- lê `manifest.json` na pasta do Drive;
- compara `manifest.revisao` com `syncState.obterRevisaoSincronizada(conta)`;
- se a nuvem estiver **mais nova**, oferece **restaurar** (substitui os dados locais);
- se as contas divergirem, só avisa;
- **nunca envia** nada para o Drive.

Ou seja: é um "verificar se a nuvem tem algo mais novo e, se tiver, baixar".
Renomear para "Sincronizar dados com a nuvem" criaria uma promessa que o botão não
cumpre (o usuário suporia que ele também **sobe** os dados locais).

**Decisão tomada: renomear de forma honesta, mantendo o comportamento.** O botão
passa a se chamar **"Verificar dados na nuvem"** — o rótulo descreve exatamente o
que acontece. O envio continua sendo feito só pelo botão "Enviar para o Drive" em
Backup e Restauração. As melhorias visuais (fundo do tema com transparência) valem
igualmente.

---

## 3. Decisões de projeto

| ID | Decisão | Justificativa |
| --- | --- | --- |
| D1 | **Nunca** chamar o GIS na abertura do app se o usuário nunca conectou neste navegador. | Atende P1/P2 sem quebrar quem já usa a nuvem. |
| D2 | Persistir apenas um **marcador booleano** (`consentimentoConcedido`) + o e-mail da conta em `localStorage` — **jamais** o access token. | Token em `localStorage` é XSS-exposto e expira em ~1h de qualquer forma. Mantém a decisão original do projeto. |
| D3 | Após F5, com o marcador presente, tentar **renovação silenciosa** (`prompt: ''`) uma única vez. Se falhar, cair para o botão flutuante. | É o mecanismo suportado pelo OAuth de navegador: sem refresh token, "manter logado" = reobter token em silêncio aproveitando a sessão Google + o consentimento já concedido. |
| D4 | Publicar o app OAuth em **Production** no Google Cloud Console. | Os escopos usados (`drive.file`, `openid`, `email`, `profile`) são **não sensíveis** e não exigem verificação/auditoria do Google. Publicar remove a tela "O Google não verificou este app" e também o limite de 7 dias de validade do consentimento do modo Testing. |
| D5 | O botão flutuante só aparece quando **já houve consentimento** e a sessão não pôde ser retomada. | Se nunca conectou, o único ponto de entrada de login é "Conectar ao Google Drive" em Backup e Restauração (P2). |
| D6 | O botão flutuante passa a ser **"Verificar dados na nuvem"** (rótulo honesto: o botão não envia nada), com fundo do gradiente do tema em ~78% de opacidade + `backdrop-filter: blur`. | Nome descreve o comportamento real (§2.1); transparência dá legibilidade sem cobrir o conteúdo por trás. |

### 3.1. Limitação aceita (documentar, não tentar contornar)

A renovação silenciosa **depende de haver sessão Google ativa no navegador** e de
cookies de terceiros para `accounts.google.com`. Em janela anônima, com cookies de
terceiros bloqueados, ou após logout do Google, a renovação falha — e aí o botão
flutuante (D5) é o caminho manual. Isso é inerente ao OAuth *implicit/token flow*
sem backend; a única forma de eliminar seria introduzir um servidor guardando
refresh tokens, o que está fora do escopo do projeto.

---

## 4. Etapas de implementação

As etapas são independentes entre si, exceto onde indicado. Cada uma termina em
estado compilável e testável.

---

### Etapa 0 — (Console Google) Publicar o app em Production — resolve P3

**Não envolve código.** No [Google Cloud Console](https://console.cloud.google.com/),
projeto que contém o Client ID
`741804975204-hrn1dbetqdto1hhb305calkhemhkfma3.apps.googleusercontent.com`:

1. **APIs & Services → OAuth consent screen** (ou *Google Auth Platform → Audience*).
2. Confirme que o **User type** é **External**.
3. Preencha o que estiver faltando em *Branding*: nome do app, e-mail de suporte,
   logotipo (opcional), **Application home page**, **Privacy policy URL** e
   **Terms of service URL** — precisam ser URLs públicas do domínio autorizado
   (`https://q-concurso-dev.netlify.app/...`).
4. Em *Authorized domains*, garanta `netlify.app` (ou o domínio próprio, se houver).
5. Em **Data access / Scopes**, confirme que constam **apenas**:
   - `https://www.googleapis.com/auth/drive.file`
   - `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`
   
   Se algum escopo sensível/restrito for adicionado no futuro, a publicação passa a
   exigir verificação do Google (processo de semanas) — evite.
6. Em **Audience**, clique em **Publish app** → confirme. O status deve virar
   **In production**.
7. Em **Clients → (seu Client ID)**, confirme *Authorized JavaScript origins* com
   `https://q-concurso-dev.netlify.app` e `http://localhost:4200`.

**Resultado esperado:** a tela "O Google não verificou este app" deixa de aparecer;
o usuário vê apenas a tela normal de consentimento ("… quer acessar sua Conta do
Google"), uma única vez por conta/navegador.

**Se por algum motivo o app precisar continuar em Testing:** a tela é inevitável.
Nesse caso, adicione as contas em *Test users* e oriente o clique em
**Continuar** → *Acessar &lt;app&gt; (não seguro)*. Além disso, em Testing o
consentimento **expira em 7 dias**, o que reintroduz P4 periodicamente.

**Validação:** janela anônima → `https://q-concurso-dev.netlify.app` → Backup e
Restauração → Conectar ao Google Drive → a tela de aviso não deve aparecer.

---

### Etapa 1 — `GoogleAuthService`: separar "conectar" de "retomar sessão" — resolve P1/P4

Arquivo: `src/app/core/cloud/google-auth.service.ts`

**1.1.** Adicionar uma chave de `localStorage` e o estado derivado:

```ts
const CHAVE_CONSENTIMENTO = 'questoes-concurso.cloud.consentimentoConcedido';
```

**1.2.** Novos membros públicos:

```ts
/**
 * Marca que este navegador já concedeu consentimento ao app alguma vez.
 * É só um marcador — nenhum token é persistido (§D2). Sem ele, o app não
 * pode nem tentar falar com o GIS na abertura, sob pena de abrir a janela
 * de autorização sem o usuário ter pedido (P1).
 */
readonly jaConsentiu = signal(localStorage.getItem(CHAVE_CONSENTIMENTO) === 'true');

/** true enquanto a retomada silenciosa de sessão está em andamento (F5). */
readonly restaurandoSessao = signal(false);

/**
 * Tenta reobter um access token SEM nenhuma interface visível, aproveitando
 * a sessão Google do navegador + o consentimento já concedido. Retorna
 * false (sem lançar) quando não há como retomar: quem chama decide se
 * oferece o caminho manual. Nunca abre popup para quem nunca consentiu.
 */
async tentarRestaurarSessao(): Promise<boolean> {
  if (!this.jaConsentiu()) return false;
  if (this.tokenValido()) return true;

  this.restaurandoSessao.set(true);

  try {
    await this.obterAccessToken();
    return true;
  } catch {
    return false;
  } finally {
    this.restaurandoSessao.set(false);
  }
}
```

**1.3.** Em `signIn()`, após sucesso, marcar o consentimento:

```ts
async signIn(): Promise<void> {
  await this.carregarScript();
  await this.comTimeout(
    this.solicitarToken('consent'),
    TIMEOUT_CONSENTIMENTO_MS,
    'A conexão com o Google demorou demais e foi cancelada. Tente novamente.',
  );
  await this.carregarConta();
  this.registrarConsentimento(true);   // <— novo
}
```

**1.4.** Em `signOut()`, limpar o marcador (desconectar é intencional; não deve
haver retomada silenciosa depois):

```ts
async signOut(): Promise<void> {
  if (this.tokenCache) {
    window.google?.accounts.oauth2.revoke(this.tokenCache.accessToken);
  }

  this.tokenCache = null;
  this.contaConectadaSignal.set(null);
  this.registrarConsentimento(false);  // <— novo
}
```

**1.5.** Helper privado:

```ts
private registrarConsentimento(concedido: boolean): void {
  if (concedido) {
    localStorage.setItem(CHAVE_CONSENTIMENTO, 'true');
  } else {
    localStorage.removeItem(CHAVE_CONSENTIMENTO);
  }

  this.jaConsentiu.set(concedido);
}
```

**1.6.** Blindar `obterAccessToken()` para nunca ser um caminho acidental de
primeiro login. Ele já usa `prompt: ''`, mas o GIS pode escalar para janela visível
quando não há grant. Adicionar a guarda no topo:

```ts
async obterAccessToken(): Promise<string> {
  if (this.tokenValido()) {
    return this.tokenCache!.accessToken;
  }

  // Sem consentimento anterior, pedir token abriria a janela do Google por
  // conta própria (P1/P2). Quem precisa de acesso deve chamar signIn().
  if (!this.jaConsentiu()) {
    throw new Error('Nenhuma conta Google conectada. Conecte-se em Backup e Restauração.');
  }

  // ...resto inalterado
}
```

> **Atenção ao efeito colateral:** `CloudBackupService.garantirAutenticado()` chama
> `estaAutenticado()` e, se falso, `signIn()`. Continua correto — as ações que
> exigem interação (enviar/listar/restaurar) partem sempre de um clique do usuário.
> Mas `enviarBackup`/`listarRevisoes` chamados com token expirado agora abrem
> consentimento em vez de renovar em silêncio. Ajuste `garantirAutenticado` para
> tentar a retomada silenciosa antes:
>
> ```ts
> private async garantirAutenticado(): Promise<void> {
>   if (this.googleAuth.estaAutenticado()) return;
>   if (await this.googleAuth.tentarRestaurarSessao()) return;
>
>   await this.googleAuth.signIn();
> }
> ```

**Testes (`google-auth.service.spec.ts`):**
- `tentarRestaurarSessao()` retorna `false` e **não** toca em `window.google`
  quando não há marcador de consentimento.
- `signIn()` grava a chave em `localStorage` e seta `jaConsentiu()`.
- `signOut()` remove a chave.
- `obterAccessToken()` lança sem consentimento prévio.

---

### Etapa 2 — `CloudBackupService.verificarAtualizacoes()`: usar a retomada silenciosa

Arquivo: `src/app/core/cloud/cloud-backup.service.ts`

Trocar o início do método:

```ts
async verificarAtualizacoes(): Promise<StatusVerificacaoNuvem> {
  // Só aproveita sessão retomável em silêncio; nunca inicia login (P1).
  if (!(await this.googleAuth.tentarRestaurarSessao())) {
    return { tipo: 'sem-sessao' };
  }

  const conta = this.googleAuth.contaConectada();
  // ...resto inalterado
}
```

Isso remove o `try/catch` em torno de `obterAccessToken()` e torna explícito que a
verificação é **passiva**.

**Testes (`cloud-backup.service.spec.ts`):** ajustar os mocks de `GoogleAuthService`
para incluir `tentarRestaurarSessao` (os casos existentes de `sem-sessao` passam a
mocká-lo como `false`).

---

### Etapa 3 — `App`: abertura sem login — resolve P1/P2/D5

Arquivos: `src/app/app.ts`, `src/app/app.html`

**3.1.** A verificação na abertura só ocorre para quem já consentiu:

```ts
constructor() {
  afterNextRender(() => {
    // Quem nunca conectou não deve ver nada de nuvem na abertura (P1/P2):
    // o único ponto de login é "Conectar ao Google Drive" em Configurações.
    if (!this.googleAuth.jaConsentiu()) return;

    void this.verificarBackupNaNuvem();
  });
}
```

**3.2.** O botão flutuante só existe para quem já consentiu e não teve a sessão
retomada. Substituir o gate de exibição em `tratarStatus`:

```ts
private tratarStatus(status: StatusVerificacaoNuvem): void {
  this.mostrarVerificacaoNuvem.set(
    status.tipo === 'sem-sessao' && this.googleAuth.jaConsentiu(),
  );
  // ...resto inalterado
}
```

(Renomeie o signal `mostrarVerificacaoManual` → `mostrarVerificacaoNuvem` e
`verificandoManualmente` → `verificandoNuvem`, conforme a Etapa 5.1.)

**3.3.** Como o usuário pode conectar pela tela de Configurações **depois** da
abertura, o botão flutuante precisa sumir quando a conta conectar. Adicionar um
`effect` no construtor:

```ts
effect(() => {
  if (this.googleAuth.contaConectada()) {
    this.mostrarVerificacaoNuvem.set(false);
  }
});
```

---

### Etapa 4 — Tela Backup e Restauração: login sob demanda e feedback de sessão — P2/P4

Arquivos: `backup-restauracao.ts` / `backup-restauracao.html`

**4.1.** Ao abrir a tela, tentar retomar a sessão em silêncio (nunca abrir popup),
para que após F5 o card apareça já "Conectado" quando possível:

```ts
constructor() {
  afterNextRender(() => {
    void this.retomarSessaoSeHouver();
  });
}

private async retomarSessaoSeHouver(): Promise<void> {
  if (await this.googleAuth.tentarRestaurarSessao()) {
    await this.carregarRevisoes();
  }
}
```

**4.2.** Expor `restaurandoSessao` e `jaConsentiu` no componente:

```ts
readonly restaurandoSessao = this.googleAuth.restaurandoSessao;
readonly jaConsentiu = this.googleAuth.jaConsentiu;
```

**4.3.** No template, no ramo `@else` (não conectado), diferenciar os três casos:

```html
} @else if (restaurandoSessao()) {
  <div class="text-sm text-color-secondary">
    <em class="pi pi-spin pi-spinner mr-2"></em>Retomando a sessão do Google...
  </div>
} @else {
  @if (jaConsentiu()) {
    <div class="mb-2 text-sm text-color-secondary">
      A sessão do Google expirou. Reconecte para enviar ou restaurar backups.
    </div>
  }

  <p-button
    label="Conectar ao Google Drive"
    icon="pi pi-google"
    [loading]="conectando()"
    (onClick)="conectar()"
    class="w-full button-aplicacao-style"
    styleClass="w-full button-aplicacao-style"
  />
}
```

**4.4.** `conectar()` permanece como está — é o **único** lugar do app que chama
`signIn()` a partir de um clique de "conectar" (o botão flutuante da Etapa 5 é o
outro, e só existe para quem já consentiu).

---

### Etapa 5 — Botão flutuante: nome e estilo — P5/D6

#### 5.1. Comportamento: inalterado, rótulo honesto

O botão continua fazendo **apenas verificação** (autenticar → ler `manifest.json` →
comparar revisões → oferecer restauração se a nuvem estiver mais nova). **Nada
sobe** para o Drive por este caminho; o envio segue exclusivo do botão "Enviar
para o Drive" em Backup e Restauração.

Portanto o rótulo passa a ser **"Verificar dados na nuvem"** — e não
"Sincronizar…", que prometeria um envio que não acontece.

Ajustes de nomenclatura em `src/app/app.ts` (coerência com o rótulo; nenhuma
mudança de lógica):

| Antes | Depois |
| --- | --- |
| `mostrarVerificacaoManual` | `mostrarVerificacaoNuvem` |
| `verificandoManualmente` | `verificandoNuvem` |
| `verificarNuvemManualmente()` | `verificarNuvemManualmente()` (mantém) |

> As Etapas 3.2/3.3 já usam os nomes novos — se forem executadas antes desta,
> não há nada a corrigir aqui.

A mensagem de sucesso do caso `atualizado` continua adequada e já existe
(`app.ts:66`): *"Seus dados já estão atualizados em relação à nuvem."*

**Nota de escopo:** transformar este botão em sincronização real (pull *ou* push)
foi avaliado e **descartado**. Se algum dia for desejado, o desenho seria um
`CloudBackupService.sincronizar()` que, quando a nuvem não estiver mais nova,
chama `enviarBackup()` — e só então o rótulo "Sincronizar dados com a nuvem"
passaria a ser correto.

#### 5.2. Estilo (fundo do tema com transparência)

Criar em `src/assets/scss/primeNG/_button.scss`:

```scss
/**
 * Botão flutuante de verificação da nuvem (canto inferior direito). Usa o gradiente
 * da identidade visual com transparência + blur para não "cobrir" o conteúdo
 * da tela por trás dele.
 */
.button-nuvem-flutuante .p-button {
  background: linear-gradient(
    90deg,
    rgba(79, 70, 229, 0.78),
    rgba(124, 58, 237, 0.78),
    rgba(192, 38, 211, 0.78)
  ) !important;
  color: $white !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 999px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
  backdrop-filter: blur(6px);
  transition: opacity $transitionDuration, box-shadow $transitionDuration !important;

  &:hover {
    opacity: 1;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.32) !important;
  }
}
```

Garanta que o parcial é importado onde os demais de `primeNG/` já são (verificar
`src/styles.scss`).

`src/app/app.html`:

```html
@if (mostrarVerificacaoNuvem()) {
  <div class="fixed bottom-0 right-0 m-3" style="z-index: 1000">
    <p-button
      label="Verificar dados na nuvem"
      icon="pi pi-cloud-download"
      size="small"
      [loading]="verificandoNuvem()"
      (onClick)="verificarNuvemManualmente()"
      class="button-nuvem-flutuante"
      styleClass="button-nuvem-flutuante"
    />
  </div>
}
```

Remova `severity="secondary"` e `[text]="true"` — eles anulam o fundo.

---

## 5. Checklist de execução

- [ ] **Etapa 0** — App OAuth publicado em *Production* no Google Cloud Console.
- [ ] **Etapa 1** — `GoogleAuthService`: `jaConsentiu`, `restaurandoSessao`,
      `tentarRestaurarSessao()`, marcação em `signIn`/`signOut`, guarda em
      `obterAccessToken`, ajuste de `garantirAutenticado`.
- [ ] **Etapa 2** — `verificarAtualizacoes()` usando `tentarRestaurarSessao()`.
- [ ] **Etapa 3** — `App` sem login na abertura + botão flutuante condicionado.
- [ ] **Etapa 4** — Tela de Backup com retomada silenciosa e estados de sessão.
- [ ] **Etapa 5.1** — Renomeação para "Verificar dados na nuvem" + ajuste dos nomes
      dos signals em `app.ts` (sem mudança de comportamento).
- [ ] **Etapa 5.2** — Estilo `.button-nuvem-flutuante` (gradiente com transparência).
- [ ] Specs atualizadas (`google-auth.service.spec.ts`, `cloud-backup.service.spec.ts`).
- [ ] `npm run build` e `npm test` verdes.

---

## 6. Roteiro de teste manual

Executar em `http://localhost:4200` e depois em produção.

| Cenário | Passos | Esperado |
| --- | --- | --- |
| Primeiro acesso | `localStorage.clear()` → recarregar | **Nenhuma** janela do Google. Nenhum botão flutuante. App usável offline. |
| Login sob demanda | Configurações → Backup e Restauração → Conectar ao Google Drive | Janela do Google abre **só agora**; sem a tela "não verificou este app" (pós-Etapa 0); card mostra "Conectado" + e-mail. |
| F5 com sessão Google ativa | Após conectar, pressionar F5 | Sem janela do Google. Card volta como "Conectado" (pode piscar "Retomando a sessão..."). |
| F5 sem sessão Google | Deslogar do Google em outra aba → F5 no app | Sem popup automático. Aparece o botão flutuante "Verificar dados na nuvem"; card mostra "A sessão do Google expirou". |
| Verificar com nuvem em dia | Clicar no botão flutuante | Consentimento (se necessário) → toast "Seus dados já estão atualizados em relação à nuvem". **Nada é enviado ao Drive** (confirmar no Drive que não surgiu revisão nova). |
| Verificar com nuvem mais nova | Enviar backup de outro dispositivo → clicar no botão | Diálogo "Backup mais novo disponível na nuvem" → Restaurar funciona. |
| Desconectar | Card → Desconectar → F5 | Volta ao estado de primeiro acesso: nenhum popup, nenhum botão flutuante. |
| Legibilidade do botão | Abrir uma tela com lista longa | Conteúdo por trás do botão continua legível através da transparência. |

---

## 7. Riscos e pontos de atenção

1. **Bloqueio de cookies de terceiros** (Safari, Brave, modo anônimo): a retomada
   silenciosa falha sempre; o usuário verá o botão flutuante a cada F5. Comportamento
   esperado, não é bug — documentar no bloco de ajuda da tela, se necessário.
2. **`jaConsentiu` pode ficar "mentindo"** se o usuário revogar o acesso em
   [myaccount.google.com/permissions](https://myaccount.google.com/permissions).
   Nesse caso, `tentarRestaurarSessao()` falha e cai no fluxo manual — que chama
   `signIn()` e reconcede. Aceitável; não requer tratamento extra.
3. **`TIMEOUT_RENOVACAO_SILENCIOSA_MS = 4000`**: em conexões lentas pode disparar
   antes do GIS responder, resultando em um "sem-sessao" falso. Se aparecer nos
   testes, subir para 6–8 s — mas não remover o timeout (sem sessão, o GIS pode
   simplesmente nunca chamar o callback).
4. **O botão flutuante nunca envia dados.** Com a decisão de renomear de forma
   honesta, o único caminho de envio continua sendo "Enviar para o Drive" em
   Backup e Restauração. Se no futuro alguém alterar o rótulo para "Sincronizar",
   o comportamento precisa mudar junto (ver nota de escopo na Etapa 5.1).
5. **Não persistir o access token** em nenhuma hipótese, mesmo que pareça resolver
   o F5 de forma mais simples: expira em ~1h e ficaria exposto a XSS.
