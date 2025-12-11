# Security Scripts | Scripts de Segurança

> 🌐 **[Versão em Português](#-português)** | **English Version Below**

---

## 🇬🇧 English

### check-credentials-secretlint.js

Wrapper script that integrates [secretlint](https://github.com/secretlint/secretlint) with Git to check for credential leaks before each commit.

#### Library Used: secretlint

[secretlint](https://github.com/secretlint/secretlint) is a robust, community-maintained npm library that detects:

- ✅ Hardcoded passwords
- ✅ Tokens and API keys (GitHub, AWS, npm, Stripe, etc.)
- ✅ URLs with credentials
- ✅ SSH/RSA private keys
- ✅ More than 50 different types of secrets

#### What It Checks:

- ✅ Hardcoded passwords (`password: "secret123"`)
- ✅ Tokens and API keys (`token: "abc123..."`, `sk_live_...`)
- ✅ URLs with credentials (`ftp://user:password@host.com`)
- ✅ SSH/RSA private keys
- ✅ Specific tokens (npm, GitHub, AWS, Stripe, etc.)

#### What It Ignores:

- ✅ Generic examples (`user:pass`, `example.com`)
- ✅ Documentation (README.md, CHANGELOG.md)
- ✅ Example files (`examples/**`)
- ✅ Project configuration files (package.json)
- ✅ Unit tests with generic mocks

#### How It Works:

The script is automatically executed in the `pre-commit` Git hook via Husky.

1. Gets staged files for commit via `git diff --cached`
2. Filters out ignored files (documentation, examples, etc.)
3. Runs `secretlint` only on relevant files
4. Blocks the commit if suspicious credentials are found
5. Shows details of the problem found

#### Run Manually:

```bash
npm run check-credentials
```

#### Example Output:

```
🔍 Checking for credential leaks with secretlint...

test/integration/sftp-integration.spec.ts
   31:33  error  [BasicAuth] found basic auth credential: ************************
   @secretlint/secretlint-rule-preset-recommend > @secretlint/secretlint-rule-basicauth

❌ SUSPICIOUS CREDENTIALS FOUND!
⚠️  The commit was blocked to prevent credential leaks.
```

#### How to Fix:

1. **Use environment variables:**

   ```typescript
   password: process.env.SFTP_PASSWORD || '';
   ```

2. **Use .env files:**

   ```bash
   # .env (added to .gitignore)
   SFTP_PASSWORD=secret_password
   ```

3. **Remove hardcoded credentials:**
   - Never commit passwords, tokens, or private keys
   - Use only generic values in documentation examples

#### Configuration:

- `.secretlintrc.json` - secretlint configuration
- `.secretlintignore` - Files ignored by the check

---

## 🇧🇷 Português

### check-credentials-secretlint.js

Script wrapper que integra [secretlint](https://github.com/secretlint/secretlint) com Git para verificar vazamento de credenciais antes de cada commit.

#### Biblioteca utilizada: secretlint

[secretlint](https://github.com/secretlint/secretlint) é uma biblioteca npm robusta e mantida pela comunidade que detecta:

- ✅ Senhas hardcoded
- ✅ Tokens e API keys (GitHub, AWS, npm, Stripe, etc)
- ✅ URLs com credenciais
- ✅ Chaves privadas SSH/RSA
- ✅ Mais de 50 tipos diferentes de segredos

#### O que verifica:

- ✅ Senhas hardcoded (`password: "senha123"`)
- ✅ Tokens e API keys (`token: "abc123..."`, `sk_live_...`)
- ✅ URLs com credenciais (`ftp://user:senha@host.com`)
- ✅ Chaves privadas SSH/RSA
- ✅ Tokens específicos (npm, GitHub, AWS, Stripe, etc)

#### O que ignora:

- ✅ Exemplos genéricos (`user:pass`, `example.com`)
- ✅ Documentação (README.md, CHANGELOG.md)
- ✅ Arquivos de exemplo (`examples/**`)
- ✅ Arquivos de configuração do projeto (package.json)
- ✅ Testes unitários com mocks genéricos

#### Como funciona:

O script é executado automaticamente no hook `pre-commit` do Git via Husky.

1. Obtém arquivos staged para commit via `git diff --cached`
2. Filtra arquivos ignorados (documentação, exemplos, etc)
3. Executa `secretlint` apenas nos arquivos relevantes
4. Bloqueia o commit se encontrar credenciais suspeitas
5. Mostra detalhes do problema encontrado

#### Executar manualmente:

```bash
npm run check-credentials
```

#### Exemplo de saída:

```
🔍 Verificando vazamento de credenciais com secretlint...

test/integration/sftp-integration.spec.ts
   31:33  error  [BasicAuth] found basic auth credential: ************************
   @secretlint/secretlint-rule-preset-recommend > @secretlint/secretlint-rule-basicauth

❌ CREDENCIAIS SUSPEITAS ENCONTRADAS!
⚠️  O commit foi bloqueado para evitar vazamento de credenciais.
```

#### Como corrigir:

1. **Use variáveis de ambiente:**

   ```typescript
   password: process.env.SFTP_PASSWORD || '';
   ```

2. **Use arquivos .env:**

   ```bash
   # .env (adicionado ao .gitignore)
   SFTP_PASSWORD=senha_secreta
   ```

3. **Remova credenciais hardcoded:**
   - Nunca commite senhas, tokens ou chaves privadas
   - Use apenas valores genéricos em exemplos de documentação

#### Configuração:

- `.secretlintrc.json` - Configuração do secretlint
- `.secretlintignore` - Arquivos ignorados pela verificação
