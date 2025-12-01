# Troubleshooting: NPM_TOKEN 401 Unauthorized

## Problema

Se você está recebendo o erro:

```
npm error 401 Unauthorized - GET https://registry.npmjs.org/-/whoami
```

Isso significa que o token do npm não está funcionando corretamente.

## Verificações

### 1. Verificar se o token está correto

O token do npm deve:

- Começar com `npm_` (tokens clássicos) ou ser um token de automação
- Ter sido copiado completamente (sem espaços extras)
- Estar configurado exatamente como `NPM_TOKEN` no GitHub Secrets

### 2. Verificar tipo de token

O token precisa ter permissão de **publicação**. Tipos válidos:

- **Automation** (recomendado para CI/CD)
- **Publish** (apenas publicação)

**NÃO funciona:**

- **Read-only**
- Tokens de usuário sem permissão de publicação

### 3. Verificar se o token não expirou

- Acesse: https://www.npmjs.com/settings/[SEU_USUARIO]/tokens
- Verifique se o token ainda está ativo
- Se expirou, gere um novo e atualize no GitHub Secrets

### 4. Verificar Two-Factor Authentication (2FA)

Se você usa 2FA no npm:

- O nível deve ser **"Authorization only"**
- **NÃO** use "Authorization and writes" (padrão)
- Acesse: https://www.npmjs.com/settings/[SEU_USUARIO]/auth

### 5. Testar o token localmente

```bash
# Configure o token
export NPM_TOKEN="seu_token_aqui"

# Teste autenticação
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
npm whoami --registry=https://registry.npmjs.org
```

Se funcionar, você verá seu nome de usuário do npm.

### 6. Verificar permissões do pacote

Certifique-se de que:

- Você é o **owner** do pacote `super-ftp` no npm
- Ou você tem permissão de **publish** no pacote
- O nome do pacote no `package.json` corresponde ao que você tem acesso

### 7. Verificar se o pacote já existe

Se o pacote `super-ftp` já existe no npm:

- Você precisa ser owner ou ter permissão de publicação
- Verifique em: https://www.npmjs.com/package/super-ftp

Se não existe, o primeiro publish criará o pacote.

## Solução: Gerar novo token

1. **Revogue o token antigo** (se necessário):
   - https://www.npmjs.com/settings/[SEU_USUARIO]/tokens
   - Clique no token → Delete

2. **Gere um novo token**:
   - Clique em "Generate New Token" → "Generate New Token (Classic)"
   - **Type**: Automation ou Publish
   - **Expiration**: Escolha uma data ou "Never expires"
   - Copie o token imediatamente

3. **Atualize no GitHub**:
   - https://github.com/thiagoburgo/super-ftp/settings/secrets/actions
   - Clique no secret `NPM_TOKEN` → Edit
   - Cole o novo token
   - Salve

4. **Teste novamente**:
   - Faça um push para `main` com um commit `feat:` ou `fix:`
   - O workflow deve funcionar agora

## Verificação no GitHub Actions

O workflow agora:

1. Configura o `.npmrc` corretamente
2. Valida o token antes de executar semantic-release
3. Falha com mensagem clara se o token estiver inválido

Se ainda falhar após seguir estes passos, verifique os logs do GitHub Actions para mensagens de erro mais específicas.
