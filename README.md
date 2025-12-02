# super-ftp

Biblioteca TypeScript reutilizável para gerenciamento unificado de FTP, SFTP e FTPS com abstrações limpas e máximo reuso de código.

## 🚀 Características

- ✅ **Suporte completo** para FTP, FTPS e SFTP
- ✅ **Interface unificada** - mesma API para todos os protocolos
- ✅ **Abstrações limpas** seguindo princípios SOLID, DRY e KISS
- ✅ **TypeScript** com tipagem completa e IntelliSense
- ✅ **Bibliotecas de mercado** - baseado em `basic-ftp` e `ssh2-sftp-client`
- ✅ **Conexão automática** (lazy connection) - conecta apenas quando necessário
- ✅ **Operações recursivas** - suporte a diretórios aninhados
- ✅ **Cobertura de testes** - 84%+ de cobertura com 150+ testes
- ✅ **Zero dependências** - apenas as bibliotecas essenciais

## 📦 Instalação

```bash
npm install super-ftp
```

## 🎯 Uso Básico

### Com String de Conexão (Recomendado)

A forma mais simples de usar é passando uma string de conexão. O protocolo é detectado automaticamente:

```typescript
import { SuperFtp } from 'super-ftp';

// FTP
const ftp = new SuperFtp('ftp://username:password@ftp.example.com:21');

// SFTP
const sftp = new SuperFtp('sftp://username:password@sftp.example.com:22');

// FTPS
const ftps = new SuperFtp('ftps://username:password@ftps.example.com:21');

// Operações são transparentes - não importa o protocolo!
await ftp.upload('/local/file.txt', '/remote/file.txt');
await ftp.download('/remote/file.txt', '/local/file.txt');
const files = await ftp.list('/remote/path');
await ftp.mkdir('/new/directory', true);
await ftp.delete('/remote/file.txt');

// Sempre desconecte quando terminar
await ftp.disconnect();
```

### Com Opções Avançadas

Você pode passar opções avançadas como segundo parâmetro para personalizar o comportamento:

```typescript
import { SuperFtp } from 'super-ftp';
import * as fs from 'fs';

// Sobrescrever porta e adicionar timeouts
const ftp = new SuperFtp('ftp://user:pass@host.com:21', {
  port: 2121, // Sobrescreve a porta da string
  connectionTimeout: 5000,
  commandTimeout: 10000,
  passive: true,
});

// Para FTPS, opções de segurança TLS
const ftps = new SuperFtp('ftps://user:pass@host.com:21', {
  secureOptions: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2',
  },
});

// Para SFTP, autenticação por chave privada
const sftp = new SuperFtp('sftp://user:pass@host.com:22', {
  privateKey: fs.readFileSync('/path/to/private/key'),
  passphrase: 'my-passphrase',
  algorithms: {
    kex: ['diffie-hellman-group-exchange-sha256'],
  },
});
```

### Com Objeto de Configuração

Alternativamente, você pode passar um objeto de configuração diretamente:

```typescript
import { SuperFtp } from 'super-ftp';

const ftp = new SuperFtp(
  {
    protocol: 'ftp', // 'ftp' | 'ftps' | 'sftp'
    host: 'ftp.example.com',
    port: 21,
    user: 'username',
    password: 'password',
  },
  {
    // Opções avançadas
    connectionTimeout: 5000,
    commandTimeout: 10000,
  },
);
```

## 📚 API Completa

### SuperFtp

Classe principal que abstrai completamente os detalhes dos protocolos. Todas as operações fazem conexão automática (lazy connection).

#### Construtor

```typescript
new SuperFtp(connection: string | IConnectionConfig, advancedOptions?: IAdvancedOptions)
```

**Parâmetros:**

- `connection`: String de conexão (`ftp://user:pass@host:port`) ou objeto de configuração
- `advancedOptions`: Opções avançadas (porta, timeouts, etc) - sobrescreve valores da string

#### Métodos de Conexão

```typescript
// Conecta ao servidor explicitamente (geralmente não necessário)
await ftp.connect(): Promise<void>

// Desconecta do servidor
await ftp.disconnect(): Promise<void>

// Verifica se está conectado
ftp.isConnected(): boolean
```

#### Métodos de Arquivo

```typescript
// Lista arquivos e diretórios
await ftp.list(path?: string): Promise<IFtpFileInfo[]>

// Obtém informações de um arquivo
await ftp.getFileInfo(path: string): Promise<IFtpFileInfo | null>

// Verifica se um arquivo ou diretório existe
await ftp.exists(path: string): Promise<boolean>

// Faz upload de um arquivo
await ftp.upload(
  localPath: string,
  remotePath: string,
  options?: IUploadOptions
): Promise<void>

// Faz download de um arquivo
await ftp.download(
  remotePath: string,
  localPath: string,
  options?: IDownloadOptions
): Promise<void>

// Faz upload de um buffer
await ftp.uploadBuffer(
  buffer: Buffer,
  remotePath: string,
  options?: IUploadOptions
): Promise<void>

// Faz download para um buffer
await ftp.downloadBuffer(remotePath: string): Promise<Buffer>
```

#### Métodos de Diretório

```typescript
// Cria um diretório
await ftp.mkdir(path: string, recursive?: boolean): Promise<void>

// Remove um diretório
await ftp.rmdir(path: string, recursive?: boolean): Promise<void>

// Altera o diretório de trabalho
await ftp.cwd(path: string): Promise<void>

// Obtém o diretório de trabalho atual
await ftp.pwd(): Promise<string>
```

#### Métodos de Manipulação

```typescript
// Remove um arquivo
await ftp.delete(path: string): Promise<void>

// Renomeia ou move um arquivo/diretório
await ftp.rename(oldPath: string, newPath: string): Promise<void>
```

## 🔧 Formato de String de Conexão

```
[protocol]://[user]:[password]@[host]:[port]
```

**Componentes:**

- **Protocolos suportados**: `ftp://`, `ftps://`, `sftp://`
- **Porta**: Opcional (usa porta padrão do protocolo se omitida)
  - FTP/FTPS: 21
  - SFTP: 22

**Exemplos:**

```typescript
// FTP padrão
'ftp://user:pass@host.com:21';

// SFTP padrão
'sftp://user:pass@host.com:22';

// FTPS com porta customizada
'ftps://user:pass@host.com:990';

// Sem porta (usa padrão)
'ftp://user:pass@host.com';
```

## 💡 Exemplos Práticos

### Upload e Download Simples

```typescript
import { SuperFtp } from 'super-ftp';

const ftp = new SuperFtp('ftp://user:pass@host.com:21');

try {
  // Upload
  await ftp.upload('./local-file.txt', '/remote/file.txt');

  // Download
  await ftp.download('/remote/file.txt', './downloaded-file.txt');

  // Upload com criação automática de diretório
  await ftp.upload('./file.txt', '/deep/nested/path/file.txt', {
    createDir: true,
  });
} finally {
  await ftp.disconnect();
}
```

### Trabalhando com Buffers

```typescript
import { SuperFtp } from 'super-ftp';

const ftp = new SuperFtp('sftp://user:pass@host.com:22');

try {
  // Upload de buffer
  const data = Buffer.from('Hello, World!');
  await ftp.uploadBuffer(data, '/remote/hello.txt');

  // Download para buffer
  const content = await ftp.downloadBuffer('/remote/hello.txt');
  console.log(content.toString()); // "Hello, World!"
} finally {
  await ftp.disconnect();
}
```

### Listagem e Navegação

```typescript
import { SuperFtp } from 'super-ftp';

const ftp = new SuperFtp('ftp://user:pass@host.com:21');

try {
  // Listar arquivos
  const files = await ftp.list('/remote/path');
  files.forEach((file) => {
    console.log(`${file.type === 'directory' ? '📁' : '📄'} ${file.name} (${file.size} bytes)`);
  });

  // Verificar se arquivo existe
  if (await ftp.exists('/remote/important.txt')) {
    const info = await ftp.getFileInfo('/remote/important.txt');
    console.log(`Arquivo encontrado: ${info?.size} bytes`);
  }

  // Navegar diretórios
  await ftp.cwd('/remote/subdirectory');
  const currentDir = await ftp.pwd();
  console.log(`Diretório atual: ${currentDir}`);
} finally {
  await ftp.disconnect();
}
```

### Operações Recursivas

```typescript
import { SuperFtp } from 'super-ftp';

const ftp = new SuperFtp('sftp://user:pass@host.com:22');

try {
  // Criar estrutura de diretórios
  await ftp.mkdir('/deep/nested/directory/structure', true);

  // Remover diretório e todo seu conteúdo
  await ftp.rmdir('/old/directory', true);
} finally {
  await ftp.disconnect();
}
```

### Tratamento de Erros

```typescript
import { SuperFtp } from 'super-ftp';

const ftp = new SuperFtp('ftp://user:pass@host.com:21');

try {
  await ftp.upload('./file.txt', '/remote/file.txt');
} catch (error) {
  console.error('Erro no upload:', error.message);
  // Tratar erro específico
} finally {
  // Sempre desconectar
  await ftp.disconnect();
}
```

## 🏗️ Arquitetura

A biblioteca segue princípios SOLID e DRY para máxima reutilização:

```
┌─────────────────┐
│   SuperFtp      │  ← Interface pública unificada
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ FtpClientFactory │  ← Factory pattern para criação
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│FtpAdapter│ │SftpAdapter│  ← Implementações específicas
└────┬───┘ └─────┬────┘
     │           │
     └─────┬─────┘
           ▼
    ┌─────────────┐
    │ BaseAdapter │  ← Código compartilhado
    └─────────────┘
```

**Componentes:**

- **Interfaces** (`IFtpClient`): Define contratos comuns para todos os protocolos
- **Adaptadores** (`FtpAdapter`, `SftpAdapter`): Implementações específicas por protocolo
- **BaseAdapter**: Classe abstrata com lógica compartilhada
- **Factory** (`FtpClientFactory`): Criação de instâncias baseada no protocolo
- **SuperFtp**: Classe principal que gerencia conexões e delega operações

## 🧪 Desenvolvimento

### Pré-requisitos

- Node.js LTS (versão especificada em `.nvmrc`)
- npm ou yarn

### Scripts Disponíveis

```bash
# Instalar dependências
npm install

# Executar todos os testes
npm test

# Executar testes unitários
npm run test:unit

# Executar testes com cobertura (usado no CI)
npm run test:cov

# Executar testes de integração (requer servidor SFTP)
npm run test:integration

# Executar todos os testes (unitários + integração)
npm run test:all

# Executar testes em modo watch
npm run test:watch

# Build do projeto
npm run build

# Build em modo watch
npm run build:watch

# Lint do código (com correção automática)
npm run lint

# Verificar lint sem corrigir
npm run lint:check

# Formatação do código
npm run format

# Verificar credenciais antes do commit
npm run check-credentials
```

### Estrutura do Projeto

```
super-ftp-lib/
├── src/
│   ├── adapters/          # Implementações FTP/SFTP
│   ├── constants/         # Constantes (portas, timeouts)
│   ├── factories/         # Factory pattern
│   ├── interfaces/        # Contratos TypeScript
│   ├── utils/             # Utilitários (parser, etc)
│   └── super-ftp.ts      # Classe principal
├── test/
│   ├── unit/             # Testes unitários
│   └── integration/      # Testes de integração (requer servidor real)
├── scripts/              # Scripts auxiliares (verificação de credenciais)
├── .github/
│   └── workflows/        # CI/CD (Quality Checks e Release)
└── dist/                 # Build output
```

### Contribuindo

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças seguindo [Conventional Commits](https://www.conventionalcommits.org/)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

#### Formato de Commits (Conventional Commits)

O projeto usa [Conventional Commits](https://www.conventionalcommits.org/) para versionamento automático via [semantic-release](https://semantic-release.gitbook.io/).

**Estrutura do commit:**

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

**Tipos de Commit:**

##### ✅ Tipos que **GERAM** nova versão:

- **`feat:`** Nova funcionalidade → Gera versão **minor** (1.0.0 → 1.1.0)

  ```bash
  git commit -m "feat: adicionar suporte a upload de múltiplos arquivos"
  ```

- **`fix:`** Correção de bug → Gera versão **patch** (1.0.0 → 1.0.1)

  ```bash
  git commit -m "fix: corrigir timeout em conexões SFTP"
  ```

- **`perf:`** Melhoria de performance → Gera versão **patch** (1.0.0 → 1.0.1)

  ```bash
  git commit -m "perf: otimizar upload de arquivos grandes"
  ```

- **`refactor:`** Refatoração → Gera versão **patch** (1.0.0 → 1.0.1)

  ```bash
  git commit -m "refactor: simplificar lógica de conexão"
  ```

- **`revert:`** Reversão de commit → Gera versão **patch** (1.0.0 → 1.0.1)

  ```bash
  git commit -m "revert: reverter mudança que causou regressão"
  ```

- **`BREAKING CHANGE:`** Mudança que quebra compatibilidade → Gera versão **major** (1.0.0 → 2.0.0)

  ```bash
  git commit -m "feat: alterar assinatura do método upload

  BREAKING CHANGE: método upload agora requer parâmetro adicional"
  ```

##### ❌ Tipos que **NÃO geram** nova versão:

- **`chore:`** Manutenção, configuração, dependências

  ```bash
  git commit -m "chore: atualizar dependências"
  git commit -m "chore: ajustar scripts de teste"
  ```

- **`docs:`** Apenas documentação

  ```bash
  git commit -m "docs: atualizar README com novos exemplos"
  ```

- **`style:`** Formatação, espaçamento, ponto-e-vírgula

  ```bash
  git commit -m "style: corrigir formatação do código"
  ```

- **`test:`** Apenas testes

  ```bash
  git commit -m "test: adicionar testes para novo método"
  ```

- **`build:`** Mudanças no sistema de build

  ```bash
  git commit -m "build: atualizar configuração do TypeScript"
  ```

- **`ci:`** Mudanças em CI/CD
  ```bash
  git commit -m "ci: adicionar novo step no workflow"
  ```

#### Automações e Hooks

O projeto possui várias automações para garantir qualidade e segurança:

##### 🔒 Pre-commit Hook

Antes de cada commit, são executados automaticamente:

1. **Verificação de credenciais** (`secretlint`)
   - Detecta senhas, tokens, API keys hardcoded
   - Bloqueia commits com credenciais suspeitas
   - Ignora exemplos genéricos e documentação

2. **Lint e formatação** (`lint-staged`)
   - Executa ESLint e Prettier nos arquivos staged
   - Corrige automaticamente problemas de formatação

##### 🚀 Pre-push Hook

Antes de cada push, são executados automaticamente:

1. **Build do projeto** (`npm run build`)
   - Compila TypeScript para JavaScript
   - Valida que não há erros de compilação

2. **Testes unitários** (`npm run test:cov`)
   - Roda todos os testes unitários
   - Gera relatório de cobertura
   - **Bloqueia push se testes falharem**

##### 🔍 CI/CD Pipeline

O projeto possui dois workflows no GitHub Actions:

1. **Quality Checks** (PRs e pushes para `develop`)
   - ESLint
   - Prettier (verificação de formatação)
   - Testes unitários com cobertura
   - Build e validação de artefatos
   - Validação de Conventional Commits (em PRs)

2. **Release** (pushes para `main`)
   - Executa todos os Quality Checks
   - Analisa commits com semantic-release
   - Gera nova versão (se houver commits que gerem versão)
   - Atualiza CHANGELOG.md
   - Publica no npm
   - Cria GitHub Release

#### Scripts de Teste

```bash
# Testes unitários (usado no CI e pre-push)
npm run test:unit

# Testes com cobertura (usado no CI)
npm run test:cov

# Testes de integração (requer servidor SFTP real)
npm run test:integration

# Todos os testes (unitários + integração)
npm run test:all

# Testes em modo watch
npm run test:watch
```

**Nota:** Testes de integração não rodam automaticamente no CI. Eles devem ser executados manualmente quando necessário.

## 📊 Cobertura de Testes

A biblioteca mantém alta cobertura de testes:

- **Statements**: 84.71%
- **Branches**: 77.54%
- **Functions**: 96.42%
- **Lines**: 84.23%

Total de **150+ testes** cobrindo:

- ✅ Todos os métodos públicos
- ✅ Casos de sucesso e erro
- ✅ Edge cases e validações
- ✅ Integração entre componentes

## 🔒 Segurança

- ✅ Suporte a FTPS (FTP sobre TLS/SSL)
- ✅ Suporte a SFTP (SSH File Transfer Protocol)
- ✅ Opções de segurança configuráveis
- ✅ Validação de certificados TLS
- ✅ Autenticação por chave privada (SFTP)

## 📝 Licença

MIT

## 🤝 Suporte

Para questões, bugs ou sugestões, abra uma issue no repositório.

---

Desenvolvido com ❤️ seguindo as melhores práticas de desenvolvimento.
