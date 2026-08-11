---
name: implementar-backup-nuvem
description: Executa, etapa por etapa, o plano de backup em nuvem (Google Drive) descrito em docs/PLANO_BACKUP_NUVEM.md — lê o plano, quebra a fase atual em etapas pequenas, implementa uma etapa, testa, corrige bugs, e a cada funcionalidade fechada commita e dá push. Use quando o usuário disser "implemente o backup na nuvem", "continue a migração do backup", "próxima etapa do plano de backup" ou citar o PLANO_BACKUP_NUVEM.
tools: Read, Glob, Grep, Bash, Edit, Write
---

# Implementar o plano de backup em nuvem

O plano completo vive em `docs/PLANO_BACKUP_NUVEM.md`. Ele é a **fonte da verdade**: se este
arquivo e o plano divergirem, o plano vence. Esta skill é apenas o procedimento de execução.

O trabalho é longo e atravessa várias sessões. Cada invocação da skill deve avançar **uma
etapa** (ou, no máximo, uma funcionalidade fechada), deixando o repositório verde e commitado
ao final. Nunca tente executar o plano inteiro de uma vez.

---

## Passo 1 — Situar-se no plano

1. Leia `docs/PLANO_BACKUP_NUVEM.md` por inteiro. Preste atenção especial ao **§7 Checklist de
   execução** — os `[x]` marcam o que já foi feito.
2. Confira o estado real do código, não confie só no checklist:
   ```
   git log --oneline -20
   git status
   ```
   e verifique a existência dos artefatos das fases anteriores (ex.: `src/app/shared/services/file-download.service.ts`,
   `src/app/core/sync/`, `src/app/core/cloud/`, `src/environments/`).
3. Determine a **fase atual** = primeira fase do §7 cujos artefatos não existem ou estão
   incompletos. Se o checklist disser que a fase está feita mas o código não confirmar, o
   código vence — relate a divergência ao usuário.
4. Confirme a branch de trabalho:
   ```
   git branch --show-current
   ```
   O fluxo deste projeto é desenvolver em `desenvolvimento` e mergear em `main`. **Não commite
   direto em `main`.** Se estiver em `main`, faça `git switch desenvolvimento` (ou crie a branch
   a partir de `main` se ela não existir localmente) antes de qualquer alteração.

## Passo 2 — Quebrar a fase em etapas

Uma **etapa** é a menor unidade que:

- pode ser implementada sem deixar o projeto sem compilar,
- é verificável (build passa, e idealmente algum teste ou verificação manual descrita), e
- cabe confortavelmente em uma sessão.

Sugestão de decomposição (ajuste conforme o estado real do código):

| Fase | Etapas |
|---|---|
| 0 | (0.1) `FileDownloadService` em `shared/services/` + `BackupService.export()` passa a usá-lo · (0.2) `buildBackup()` público · (0.3) `importarDeBackup(backup, mode)` extraído, com `import(file, mode)` virando wrapper |
| 1 | (1.1) `DispositivoService` em `core/sync/` (UUID + nome editável) · (1.2) campos opcionais `revisao`/`dispositivoId`/`dispositivoNome` em `BackupData` e preenchimento no `buildBackup()` · (1.3) `BackupValidatorService` tolerante a backups antigos |
| 2 | (2.0) **configuração externa no Google Cloud Console — bloqueante, ver Passo 6** · (2.1) `src/environments/` + `client_id` · (2.2) `sync-state.service.ts` · (2.3) `google-auth.service.ts` · (2.4) `google-drive.client.ts` · (2.5) `cloud-backup.service.ts` (manifest, revisões, poda) |
| 3 | (3.1) bloco "Backup na nuvem" em `backup-restauracao` (conectar/desconectar + conta) · (3.2) "Enviar para o Drive" · (3.3) lista de revisões com restauração · (3.4) campo de nome do dispositivo |
| 4 | (4.1) `verificarAtualizacoes()` pós-render · (4.2) diálogo de restauração com números explícitos · (4.3) fallback manual + detecção de troca de conta |
| 5 | Tarefas majoritariamente não-código — ver Passo 6 |
| 6 | Opcional; só iniciar se o usuário pedir explicitamente |

Apresente ao usuário, em poucas linhas: fase atual, etapa que você vai executar agora, e o que
fica para depois. Não é uma pergunta bloqueante — siga em frente, a menos que a etapa dependa
de decisão externa (Passo 6).

## Passo 3 — Implementar a etapa

Regras que valem para todas as etapas:

- **Não quebrar o backup em arquivo que já funciona.** `export()`/`import()` do
  `BackupService` continuam com o mesmo comportamento observável do ponto de vista da UI.
- **Retrocompatibilidade de formato:** campos novos em `BackupData` são opcionais.
  Não subir `BACKUP_VERSION` para 3 enquanto a validação não exigir os campos novos (§4 Fase 1
  do plano).
- Siga os padrões já estabelecidos no projeto: `@Injectable({providedIn: 'root'})` com `inject()`,
  signals para estado de componente, PrimeNG (`ConfirmationService`/`MessageService`) para
  diálogos e toasts, textos de UI em português.
- Nomes de campo do domínio em português (`revisao`, `dispositivoId`, `exportadoEm`), como no
  manifest do §2.2 do plano.
- Restauração vinda da nuvem usa **`ImportMode.REPLACE`**, nunca `MERGE` (§6.2 do plano) — e a
  mensagem para o usuário deve dizer explicitamente que dados locais serão substituídos.
- O app precisa continuar 100% funcional **sem** conta Google conectada (§2.5). Nenhuma rota,
  serviço ou tela pode passar a exigir autenticação.

## Passo 4 — Testar

Nesta ordem, parando no primeiro que falhar:

1. Build (pega a maior parte dos erros, incluindo templates):
   ```
   npm run build
   ```
2. Testes unitários (runner é Vitest via `@angular/build:unit-test`):
   ```
   npm test -- --watch=false
   ```
   Se a etapa criou lógica pura e testável (validador, cálculo de revisão, poda de revisões
   antigas, chaveamento de `localStorage` por conta), **escreva um `.spec.ts`** ao lado do
   arquivo, no mesmo estilo de `src/app/pages/estatisticas/core/services/estatistica.service.spec.ts`.
   Não escreva teste de fachada para wrapper trivial.
3. Verificação manual, quando a etapa toca a UI ou o Drive: descreva ao usuário, em passos
   numerados, o que abrir e o que deve acontecer (ex.: "Configurações → Backup e restauração →
   Baixar backup deve continuar baixando o JSON com os mesmos dados"). Chamadas reais ao Drive
   só podem ser validadas pelo usuário — você não tem a conta Google dele.

## Passo 5 — Corrigir bugs

Se o build ou os testes falharem:

- Corrija a causa, não o sintoma. Não silencie erro de tipo com `any`/`!` nem exclua um teste
  para o pipeline passar.
- Se o erro revelar que o plano está errado sobre o código atual (ex.: uma assinatura que o plano
  supõe e que não existe), **atualize `docs/PLANO_BACKUP_NUVEM.md`** junto com a correção e
  avise o usuário no relato final.
- Se após 3 tentativas o erro persistir, pare e apresente ao usuário o que tentou, o erro
  atual e as opções. Não fique iterando.

## Passo 6 — Etapas bloqueadas por ação externa

Algumas etapas dependem do usuário e **não podem ser feitas por você**:

- **Fase 2.0** — criar projeto no Google Cloud Console, ativar a Drive API, criar o OAuth
  Client ID (Web application), cadastrar as origens `http://localhost:4200` e o domínio de
  produção. Você precisa do `client_id` resultante para preencher `src/environments/`.
- **Fase 5** — publicar a tela de consentimento em Production, política de privacidade com URL
  pública, hospedagem com domínio fixo, nome/logo do app.

Ao chegar numa dessas: implemente tudo o que **não** depende do dado externo (ex.: criar
`src/environments/environment.ts` com o `client_id` vazio e um comentário de como preenchê-lo),
depois liste ao usuário, em passos numerados e clicáveis, exatamente o que ele precisa fazer no
console, e o que trazer de volta. Não invente um `client_id` nem crie um placeholder que passe
despercebido como valor real.

## Passo 7 — Fechar a funcionalidade e commitar

Uma etapa só está "fechada" quando: build verde, testes verdes, e o comportamento anterior do
app preservado. Se a etapa ficou pela metade, **não commite** — relate e pare.

Estando fechada:

1. Marque a caixa correspondente no §7 do `docs/PLANO_BACKUP_NUVEM.md` quando a **fase inteira**
   terminar (etapas intermediárias não marcam nada; se quiser registrar progresso parcial,
   anote entre parênteses na linha da fase, ex.: `(0.1 e 0.2 feitas)`).
2. Stage explícito, arquivo por arquivo — nunca `git add -A` / `git add .`:
   ```
   git add <arquivo1> <arquivo2> ...
   git status
   ```
3. Mensagem no padrão do projeto (confirme com `git log -15 --format="%s"`; no momento em que
   esta skill foi escrita era `<TIPO>: - <descrição curta em português>`, com `FEAT`/`FIX`):
   ```bash
   git commit -m "$(cat <<'EOF'
   FEAT: - <descrição do que a etapa entregou>

   Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
   EOF
   )"
   ```
4. Confira o resultado:
   ```
   git log -1 --stat
   ```

Se preferir, delegue os passos 2–4 à skill `commit-closed-feature`, que já cobre o
agrupamento e o padrão de mensagem — mas o critério de "fechada" acima continua valendo.

## Passo 8 — Push

```
git push
```

Push para `desenvolvimento`. Nunca `--force`, nunca push direto em `main` — o merge em `main`
é decisão do usuário, feita fora desta skill.

Se o pedido original do usuário não incluía push explicitamente, confirme antes.

## Passo 9 — Relato

Encerre com poucas frases:

- Etapa concluída e hash do commit.
- Se o push foi feito.
- O que verificar manualmente no app, se aplicável.
- **Próxima etapa** sugerida, e se ela está bloqueada por alguma ação externa do Passo 6.
