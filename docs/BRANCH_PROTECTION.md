# Configuração de Branch Protection para `main`

## Problema

O GitHub Free plan não permite configurar bypass automático para `github-actions[bot]` nas regras de branch protection. Isso impede que o `semantic-release` faça commits diretos na branch `main` (criar tags, atualizar changelog, etc.).

## Solução: Usar Personal Access Token (PAT)

### Passo 1: Criar o PAT

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Configure:
   - **Note**: `super-ftp-release-bot`
   - **Expiration**: Escolha uma data (ou "No expiration" para tokens de longa duração)
   - **Scopes**: Marque:
     - ✅ `repo` (acesso completo ao repositório)
     - ✅ `workflow` (se disponível)

4. Clique em **"Generate token"**
5. **Copie o token imediatamente** (você não poderá vê-lo novamente)

### Passo 2: Adicionar como Secret no GitHub

1. Acesse: `https://github.com/thiagoburgo/super-ftp/settings/secrets/actions`
2. Clique em **"New repository secret"**
3. Configure:
   - **Name**: `GITHUB_TOKEN_RELEASE`
   - **Secret**: Cole o token que você copiou
4. Clique em **"Add secret"**

### Passo 3: Configurar Branch Protection

Na configuração de branch protection para `main`:

1. ✅ **Require a pull request before merging** (marque)
2. ✅ **Require approvals** (marque, configure para 1 aprovação)
3. ✅ **Require status checks to pass before merging** (marque)
   - Selecione: `Quality Checks` e `Validate Conventional Commits`
   - ✅ Marque: "Require branches to be up to date before merging"
4. ❌ **Allow force pushes** (desmarque)
5. ❌ **Allow deletions** (desmarque)

### Como funciona

- O workflow `release.yml` tentará usar `GITHUB_TOKEN_RELEASE` primeiro
- Se não existir, usará `GITHUB_TOKEN` (fallback)
- O PAT tem permissões de bypass, permitindo commits diretos do semantic-release
- PRs de desenvolvedores ainda precisarão de aprovação

## Alternativa: Desabilitar proteção de PR temporariamente

Se você não quiser criar um PAT agora, pode:

1. **Desmarcar** "Require a pull request before merging" temporariamente
2. O semantic-release funcionará normalmente
3. **Recomendação**: Reative a proteção após configurar o PAT

⚠️ **Atenção**: Sem a proteção de PR, qualquer push direto na `main` será permitido.

## Verificação

Após configurar, teste fazendo um commit `feat:` ou `fix:` na `main`:

```bash
git checkout main
git commit -m "feat: test release"
git push origin main
```

O semantic-release deve:

1. Executar os testes
2. Criar uma nova versão
3. Fazer commit do changelog e version bump
4. Criar uma tag
5. Publicar no npm

Se tudo funcionar, você verá os commits do bot na `main` sem precisar de PR.
