---
name: commit-closed-feature
description: Analisa as alterações não commitadas do repositório, propõe um subconjunto coerente (uma funcionalidade fechada) para commit, adiciona ao stage, gera uma mensagem de commit seguindo o padrão do projeto, commita e dá push. Use quando o usuário disser "commite o que está pronto", "faça um commit parcial", "analise as alterações e commite" ou pedir para preparar/commitar/dar push de uma funcionalidade específica.
tools: Read, Glob, Grep, Bash, Edit
---

# Commit de funcionalidade fechada

Fluxo completo para transformar um working tree com várias alterações misturadas
(algumas prontas, outras em andamento/quebradas) em um commit coerente, com mensagem
no padrão do projeto, e publicá-lo.

**Nunca** faça `git add -A`/`git add .` nem `git commit --amend` nem `git push --force`
nesta skill. Cada passo abaixo é intencional.

## Passo 1 — Levantar o estado atual

```
git status
git diff --stat
git diff --stat --cached
```

Para cada arquivo modificado/untracked, entenda **o que mudou e por quê** — leia o
diff (`git diff -- <arquivo>` ou `git diff --cached -- <arquivo>`), não só o nome do
arquivo. Não assuma que "modificado" = "pronto".

## Passo 2 — Agrupar em unidades coerentes

Agrupe as alterações em possíveis commits, cada um representando **uma funcionalidade
ou correção fechada** — algo que, sozinho, compila e faz sentido como unidade de
histórico. Sinais de que um arquivo pertence a um grupo:

- É consumido ou consome diretamente outro arquivo do grupo (import direto).
- É uma dependência de compilação do grupo (ex.: uma classe base cuja assinatura de
  construtor mudou e é usada pelo grupo).
- Está documentado como concluído em `MIGRATION_STATUS.md` (ou doc equivalente do
  projeto) na mesma alteração.

Sinais de que um arquivo **não** deve entrar no commit proposto:

- Está comentado por inteiro, tem `TODO`/rascunho incompleto, ou referencia símbolos
  que não existem (grep por tipos/serviços importados mas não definidos).
- É de um módulo diferente e não é uma dependência de compilação do grupo escolhido.
- É un tracked e não relacionado ao código (scripts de setup, notas soltas, arquivos de
  configuração local).
- Faz parte de um trabalho maior ainda incompleto (ex.: metade das entidades de um
  domínio) — prefira esperar o conjunto ficar coerente a forçar um corte arbitrário.

Se houver mais de um grupo coerente e independente, proponha comitá-los em commits
separados (não junte tudo em um commit gigante só porque estava tudo pendente).

## Passo 3 — Propor ao usuário

Antes de tocar no índice do git, apresente um resumo curto:

- Lista de arquivos propostos para o commit (com um comentário de uma linha do porquê
  cada um pertence ao grupo).
- Lista de arquivos que ficarão de fora e por quê (rascunho quebrado, módulo não
  relacionado, trabalho incompleto, etc.) — isso é tão importante quanto a lista de
  dentro, para o usuário confirmar que nada relevante ficou esquecido.

Se o usuário já pediu explicitamente "commite e dê push" sem querer revisar a lista
antes, siga direto para o Passo 4, mas ainda assim **exiba** o resumo como parte da
resposta (transparência, não é uma pergunta bloqueante nesse caso).

## Passo 4 — Stage

```
git add <arquivo1> <arquivo2> ...
```

Sempre listando arquivos explicitamente (nunca `-A`/`.`). Depois confirme:

```
git status
```

## Passo 5 — Analisar o staged e montar a mensagem

```
git diff --cached --stat
git log -15 --format="%s"
```

Extraia o padrão de mensagens do projeto a partir do histórico real (não assuma) — no
momento em que esta skill foi criada, o padrão observado neste projeto era:

```
<TIPO>: - <descrição curta em português, frase nominal, sem corpo>
```

com `TIPO` em maiúsculas (`FEAT`, `FIX`) e a descrição resumindo o resultado da
mudança, não a lista de arquivos. Sem corpo/detalhamento adicional nos commits
observados. Se o histórico mudar no futuro, siga o padrão *atual* do `git log`, não
este texto congelado.

Monte a mensagem via heredoc, terminando com a assinatura de coautoria:

```bash
git commit -m "$(cat <<'EOF'
<TIPO>: - <descrição>

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

## Passo 6 — Commit e verificação

```
git commit -m "..."
git status
git log -1 --stat
```

Confirme que o commit contém exatamente os arquivos propostos (nada a mais, nada a
menos).

## Passo 7 — Push

Antes de dar push, confirme que o usuário realmente quer publicar agora (push afeta
estado compartilhado/remoto). Se o pedido original já incluía "e dê push" de forma
explícita, prossiga sem perguntar de novo; caso contrário, confirme.

```
git push
```

Nunca use `--force` a menos que o usuário peça explicitamente, e mesmo assim alerte
sobre o risco antes de executar.

## Passo 8 — Encerramento

Relate em poucas frases: o que foi commitado, o hash do commit, se o push teve sucesso,
e o que ficou de fora (para o usuário decidir quando retomar).
