# Configuração do NPM_TOKEN para Semantic Release

## Problema

O semantic-release precisa de um token do npm para publicar pacotes. Se você ver o erro:

```
npm error 401 Unauthorized - GET https://registry.npmjs.org/-/whoami
```

Isso significa que o `NPM_TOKEN` não está configurado ou é inválido.

## Solução: Criar e Configurar o NPM_TOKEN

### Passo 1: Criar um Access Token no npm

1. Acesse: https://www.npmjs.com/settings/[SEU_USUARIO]/tokens
   - Substitua `[SEU_USUARIO]` pelo seu nome de usuário do npm
   - Ou acesse: https://www.npmjs.com → Clique no seu avatar → "Access Tokens"

2. Clique em **"Generate New Token"** → **"Generate New Token (Classic)"**

3. Configure:
   - **Token name**: `super-ftp-ci` (ou qualquer nome descritivo)
   - **Type**: **Automation** (recomendado para CI/CD)
     - Ou **Publish** se você quiser apenas publicar pacotes
   - **Expiration**: Escolha uma data (ou "Never expires" para tokens de longa duração)

4. Clique em **"Generate Token"**

5. **Copie o token imediatamente** (você não poderá vê-lo novamente)
   - O token começa com `npm_` seguido de caracteres alfanuméricos

### Passo 2: Adicionar como Secret no GitHub

1. Acesse: https://github.com/thiagoburgo/super-ftp/settings/secrets/actions

2. Clique em **"New repository secret"**

3. Configure:
   - **Name**: `NPM_TOKEN` (exatamente assim, em maiúsculas)
   - **Secret**: Cole o token que você copiou do npm

4. Clique em **"Add secret"**

### Passo 3: Verificar

Após configurar, o próximo push para `main` deve:

1. Executar o workflow de release
2. Verificar o token do npm
3. Publicar o pacote no npm (se houver commits que gerem release)

## Verificação do Token

Você pode verificar se o token está funcionando localmente:

```bash
export NPM_TOKEN="seu_token_aqui"
npm whoami --registry=https://registry.npmjs.org
```

Se funcionar, você verá seu nome de usuário do npm.

## Troubleshooting

### Token inválido ou expirado

- Gere um novo token no npm
- Atualize o secret `NPM_TOKEN` no GitHub

### Permissões insuficientes

- Certifique-se de que o token tem permissão de **Publish** ou **Automation**
- Verifique se você tem permissão para publicar o pacote `super-ftp` no npm

### Two-Factor Authentication (2FA)

- Se você usa 2FA, configure o nível para **"Authorization only"**
- O nível padrão "Authorization and writes" não funciona com semantic-release

## Links Úteis

- [npm Access Tokens](https://docs.npmjs.com/getting-started/working_with_tokens)
- [semantic-release npm plugin](https://github.com/semantic-release/npm)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
