# super-ftp

[![npm version](https://img.shields.io/npm/v/super-ftp.svg)](https://www.npmjs.com/package/super-ftp)
[![npm downloads](https://img.shields.io/npm/dm/super-ftp.svg)](https://www.npmjs.com/package/super-ftp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![Coverage](https://img.shields.io/badge/Coverage-84%25-brightgreen.svg)](https://github.com/thiagoburgo/super-ftp)

> 🌐 **[Versão em Português](#-português)** | **English Version Below**

---

## 🇬🇧 English

Reusable TypeScript library for unified FTP, SFTP, and FTPS management with clean abstractions and maximum code reuse.

### 🚀 Features

- ✅ **Full support** for FTP, FTPS, and SFTP
- ✅ **Unified interface** - same API for all protocols
- ✅ **Clean abstractions** following SOLID, DRY, and KISS principles
- ✅ **TypeScript** with complete typing and IntelliSense
- ✅ **Industry-standard libraries** - based on `basic-ftp` and `ssh2-sftp-client`
- ✅ **Automatic connection** (lazy connection) - connects only when needed
- ✅ **Recursive directory transfers** - `uploadDir()` and `downloadDir()` methods
- ✅ **Progress callbacks** - real-time transfer progress monitoring
- ✅ **Auto-reconnect** - automatic reconnection on connection failures
- ✅ **Connection health checks** - monitor and validate connection status
- ✅ **Recursive operations** - support for nested directories
- ✅ **Test coverage** - 84%+ coverage with 150+ tests
- ✅ **Zero bloat** - only essential dependencies

### 📦 Installation

```bash
npm install super-ftp
```

### 🔌 Supported Protocols

This library provides unified support for three file transfer protocols:

#### **FTP** (File Transfer Protocol)

- **Port**: 21 (default)
- **Security**: Unencrypted
- **Use case**: Internal networks, legacy systems
- **Connection string**: `ftp://user:pass@host.com:21`

#### **FTPS** (FTP over TLS/SSL)

- **Port**: 21 (default) or 990 (implicit)
- **Security**: Encrypted using TLS/SSL
- **Use case**: Secure file transfers over FTP protocol
- **Connection string**: `ftps://user:pass@host.com:21`
- **Features**: Supports TLS/SSL options (`secureOptions`)

#### **SFTP** (SSH File Transfer Protocol)

- **Port**: 22 (default)
- **Security**: Encrypted using SSH
- **Use case**: Secure file transfers, modern systems
- **Connection string**: `sftp://user:pass@host.com:22`
- **Features**: Supports private key authentication, SSH algorithms configuration

**Important Notes:**

- All three protocols share the **same unified API** - switch protocols without changing your code
- FTPS uses the same adapter as FTP but with `secure: true` flag enabled
- The protocol is automatically detected from the connection string prefix (`ftp://`, `ftps://`, `sftp://`)

### 🎯 Basic Usage

#### With Connection String (Recommended)

The simplest way is to pass a connection string. The protocol is automatically detected:

```typescript
import { SuperFtp } from 'super-ftp';

// FTP
const ftp = new SuperFtp('ftp://username:password@ftp.example.com:21');

// SFTP
const sftp = new SuperFtp('sftp://username:password@sftp.example.com:22');

// FTPS
const ftps = new SuperFtp('ftps://username:password@ftps.example.com:21');

// Operations are transparent - the protocol doesn't matter!
await ftp.upload('/local/file.txt', '/remote/file.txt');
await ftp.download('/remote/file.txt', '/local/file.txt');
const files = await ftp.list('/remote/path');
await ftp.mkdir('/new/directory', true);
await ftp.delete('/remote/file.txt');

// Always disconnect when done
await ftp.disconnect();
```

#### With Advanced Options

You can pass advanced options as a second parameter to customize behavior:

```typescript
import { SuperFtp } from 'super-ftp';
import * as fs from 'fs';

// Override port and add timeouts
const ftp = new SuperFtp('ftp://user:pass@host.com:21', {
  port: 2121, // Overrides the port from the string
  connectionTimeout: 5000,
  commandTimeout: 10000,
  passive: true,
});

// For FTPS, TLS security options
const ftps = new SuperFtp('ftps://user:pass@host.com:21', {
  secureOptions: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2',
  },
});

// For SFTP, private key authentication
const sftp = new SuperFtp('sftp://user:pass@host.com:22', {
  privateKey: fs.readFileSync('/path/to/private/key'),
  passphrase: 'my-passphrase',
  algorithms: {
    kex: ['diffie-hellman-group-exchange-sha256'],
  },
});
```

#### With Configuration Object

Alternatively, you can pass a configuration object directly:

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
    // Advanced options
    connectionTimeout: 5000,
    commandTimeout: 10000,
  },
);
```

### ⚙️ Advanced Configuration Options

#### Connection Options

```typescript
interface IConnectionConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  connectionTimeout?: number; // Connection timeout in ms (default: 30000)
  commandTimeout?: number; // Command timeout in ms (default: 30000)
  passive?: boolean; // Use passive mode (default: true)
  autoReconnect?: boolean; // Auto-reconnect on failures (default: true)
  maxReconnectAttempts?: number; // Max reconnect attempts (default: 3)
  reconnectDelay?: number; // Delay between reconnect attempts in ms (default: 1000)
}
```

#### Upload/Download Options with Progress and Concurrency

```typescript
interface IUploadOptions {
  createDir?: boolean; // Create directory if it doesn't exist
  mode?: 'binary' | 'ascii'; // Transfer mode
  onProgress?: (transferred: number, total: number) => void; // Progress callback
  concurrency?: number; // Number of concurrent operations (SFTP only, default: 64)
  chunkSize?: number; // Chunk size in bytes (SFTP only, default: 32768)
}

interface IDownloadOptions {
  mode?: 'binary' | 'ascii'; // Transfer mode
  onProgress?: (transferred: number, total: number) => void; // Progress callback
  concurrency?: number; // Number of concurrent operations (SFTP only, default: 64)
  chunkSize?: number; // Chunk size in bytes (SFTP only, default: 32768)
}
```

**Example with progress callbacks and concurrency (SFTP):**

```typescript
await sftp.upload('/local/file.txt', '/remote/file.txt', {
  onProgress: (transferred, total) => {
    console.log(`Progress: ${Math.round((transferred / total) * 100)}%`);
  },
  concurrency: 32, // Use 32 concurrent reads (SFTP only)
  chunkSize: 65536, // Use 64KB chunks (SFTP only)
});
```

#### Retry Configuration

```typescript
interface IConnectionConfig {
  // ... other options
  maxRetries?: number; // Max retry attempts for operations (default: 3)
  retryDelay?: number; // Initial retry delay in ms (default: 1000)
  retryBackoffMultiplier?: number; // Exponential backoff multiplier (default: 2)
}
```

**Example with retry configuration:**

```typescript
const ftp = new SuperFtp('ftp://user:pass@host.com:21', {
  maxRetries: 5,
  retryDelay: 500,
  retryBackoffMultiplier: 2, // Delays: 500ms, 1000ms, 2000ms, 4000ms, 8000ms
});
```

### 📚 Complete API

#### SuperFtp

Main class that completely abstracts protocol details. All operations use automatic connection (lazy connection).

##### Constructor

```typescript
new SuperFtp(connection: string | IConnectionConfig, advancedOptions?: IAdvancedOptions)
```

**Parameters:**

- `connection`: Connection string (`ftp://user:pass@host:port`) or configuration object
- `advancedOptions`: Advanced options (port, timeouts, etc) - overrides string values

##### Connection Methods

```typescript
// Connect to server explicitly (usually not necessary)
await ftp.connect(): Promise<void>

// Disconnect from server
await ftp.disconnect(): Promise<void>

// Check if connected
ftp.isConnected(): boolean

// Health check the connection
await ftp.healthCheck(): Promise<boolean>

// Get connection statistics
ftp.getConnectionStats(): {
  connected: boolean;
  hasConnectedBefore: boolean;
  lastActivity: Date;
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  reconnectDelay: number;
}

// Force a manual reconnection
await ftp.forceReconnect(): Promise<void>
```

##### File Methods

```typescript
// List files and directories
await ftp.list(path?: string): Promise<IFtpFileInfo[]>

// Get file information
await ftp.getFileInfo(path: string): Promise<IFtpFileInfo | null>

// Check if a file or directory exists
await ftp.exists(path: string): Promise<boolean>

// Upload a file
await ftp.upload(
  localPath: string,
  remotePath: string,
  options?: IUploadOptions
): Promise<void>

// Download a file
await ftp.download(
  remotePath: string,
  localPath: string,
  options?: IDownloadOptions
): Promise<void>

// Upload a buffer
await ftp.uploadBuffer(
  buffer: Buffer,
  remotePath: string,
  options?: IUploadOptions
): Promise<void>

// Download to a buffer
await ftp.downloadBuffer(remotePath: string): Promise<Buffer>

// Upload a directory recursively
await ftp.uploadDir(
  localDir: string,
  remoteDir: string,
  options?: IUploadOptions
): Promise<void>

// Download a directory recursively
await ftp.downloadDir(
  remoteDir: string,
  localDir: string,
  options?: IDownloadOptions
): Promise<void>

// Batch transfer multiple files with concurrency control
await ftp.batchTransfer(
  transfers: IBatchTransfer[],
  maxConcurrency?: number
): Promise<IBatchTransferResult[]>
```

**Batch Transfer Example:**

```typescript
const results = await ftp.batchTransfer(
  [
    { type: 'upload', localPath: '/local/file1.txt', remotePath: '/remote/file1.txt' },
    { type: 'upload', localPath: '/local/file2.txt', remotePath: '/remote/file2.txt' },
    { type: 'download', localPath: '/local/file3.txt', remotePath: '/remote/file3.txt' },
  ],
  3, // Max 3 concurrent transfers
);

// Check results
results.forEach((result) => {
  if (result.success) {
    console.log(`✓ ${result.transfer.type} completed in ${result.duration}ms`);
  } else {
    console.error(`✗ ${result.transfer.type} failed: ${result.error?.message}`);
  }
});
```

##### Directory Methods

```typescript
// Create a directory
await ftp.mkdir(path: string, recursive?: boolean): Promise<void>

// Remove a directory
await ftp.rmdir(path: string, recursive?: boolean): Promise<void>

// Change working directory
await ftp.cwd(path: string): Promise<void>

// Get current working directory
await ftp.pwd(): Promise<string>
```

##### Manipulation Methods

```typescript
// Delete a file
await ftp.delete(path: string): Promise<void>

// Rename or move a file/directory
await ftp.rename(oldPath: string, newPath: string): Promise<void>
```

### 🔧 Connection String Format

```
[protocol]://[user]:[password]@[host]:[port]
```

**Components:**

- **Supported protocols**: `ftp://`, `ftps://`, `sftp://`
- **Port**: Optional (uses protocol default if omitted)
  - FTP/FTPS: 21
  - SFTP: 22

**Examples:**

```typescript
// Standard FTP
'ftp://user:pass@host.com:21';

// Standard SFTP
'sftp://user:pass@host.com:22';

// FTPS with custom port
'ftps://user:pass@host.com:990';

// Without port (uses default)
'ftp://user:pass@host.com';
```

### 💡 Practical Examples

#### Simple Upload and Download

```typescript
import { SuperFtp } from 'super-ftp';

const ftp = new SuperFtp('ftp://user:pass@host.com:21');

try {
  // Upload
  await ftp.upload('./local-file.txt', '/remote/file.txt');

  // Download
  await ftp.download('/remote/file.txt', './downloaded-file.txt');

  // Upload with automatic directory creation
  await ftp.upload('./file.txt', '/deep/nested/path/file.txt', {
    createDir: true,
  });
} finally {
  await ftp.disconnect();
}
```

#### Working with Buffers

```typescript
import { SuperFtp } from 'super-ftp';

const ftp = new SuperFtp('sftp://user:pass@host.com:22');

try {
  // Upload buffer
  const data = Buffer.from('Hello, World!');
  await ftp.uploadBuffer(data, '/remote/hello.txt');

  // Download to buffer
  const content = await ftp.downloadBuffer('/remote/hello.txt');
  console.log(content.toString()); // "Hello, World!"
} finally {
  await ftp.disconnect();
}
```

#### Listing and Navigation

```typescript
import { SuperFtp } from 'super-ftp';

const ftp = new SuperFtp('ftp://user:pass@host.com:21');

try {
  // List files
  const files = await ftp.list('/remote/path');
  files.forEach((file) => {
    console.log(`${file.type === 'directory' ? '📁' : '📄'} ${file.name} (${file.size} bytes)`);
  });

  // Check if file exists
  if (await ftp.exists('/remote/important.txt')) {
    const info = await ftp.getFileInfo('/remote/important.txt');
    console.log(`File found: ${info?.size} bytes`);
  }

  // Navigate directories
  await ftp.cwd('/remote/subdirectory');
  const currentDir = await ftp.pwd();
  console.log(`Current directory: ${currentDir}`);
} finally {
  await ftp.disconnect();
}
```

#### Recursive Operations

```typescript
import { SuperFtp } from 'super-ftp';

const ftp = new SuperFtp('sftp://user:pass@host.com:22');

try {
  // Create directory structure
  await ftp.mkdir('/deep/nested/directory/structure', true);

  // Remove directory and all its contents
  await ftp.rmdir('/old/directory', true);
} finally {
  await ftp.disconnect();
}
```

#### Error Handling

```typescript
import { SuperFtp } from 'super-ftp';

const ftp = new SuperFtp('ftp://user:pass@host.com:21');

try {
  await ftp.upload('./file.txt', '/remote/file.txt');
} catch (error) {
  console.error('Upload error:', error.message);
  // Handle specific error
} finally {
  // Always disconnect
  await ftp.disconnect();
}
```

### 🏗️ Architecture

The library follows SOLID and DRY principles for maximum reuse:

```
┌─────────────────┐
│   SuperFtp      │  ← Unified public interface
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ FtpClientFactory │  ← Factory pattern for creation
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│FtpAdapter│ │SftpAdapter│  ← Specific implementations
└────┬───┘ └─────┬────┘
     │           │
     └─────┬─────┘
           ▼
    ┌─────────────┐
    │ BaseAdapter │  ← Shared code
    └─────────────┘
```

**Components:**

- **Interfaces** (`IFtpClient`): Defines common contracts for all protocols
- **Adapters** (`FtpAdapter`, `SftpAdapter`): Protocol-specific implementations
- **BaseAdapter**: Abstract class with shared logic
- **Factory** (`FtpClientFactory`): Instance creation based on protocol
- **SuperFtp**: Main class that manages connections and delegates operations

### 🔒 Security

- ✅ FTPS support (FTP over TLS/SSL)
- ✅ SFTP support (SSH File Transfer Protocol)
- ✅ Configurable security options
- ✅ TLS certificate validation
- ✅ Private key authentication (SFTP)

### 📊 Test Coverage

The library maintains high test coverage:

- **Statements**: 84.71%
- **Branches**: 77.54%
- **Functions**: 96.42%
- **Lines**: 84.23%

Total of **150+ tests** covering:

- ✅ All public methods
- ✅ Success and error cases
- ✅ Edge cases and validations
- ✅ Component integration

### 📝 License

MIT

### 🤝 Support

For questions, bugs, or suggestions, please open an issue in the repository.

---

## 🇧🇷 Português

Biblioteca TypeScript reutilizável para gerenciamento unificado de FTP, SFTP e FTPS com abstrações limpas e máximo reuso de código.

### 🚀 Características

- ✅ **Suporte completo** para FTP, FTPS e SFTP
- ✅ **Interface unificada** - mesma API para todos os protocolos
- ✅ **Abstrações limpas** seguindo princípios SOLID, DRY e KISS
- ✅ **TypeScript** com tipagem completa e IntelliSense
- ✅ **Bibliotecas de mercado** - baseado em `basic-ftp` e `ssh2-sftp-client`
- ✅ **Conexão automática** (lazy connection) - conecta apenas quando necessário
- ✅ **Transferências recursivas de diretórios** - métodos `uploadDir()` e `downloadDir()`
- ✅ **Callbacks de progresso** - monitoramento de progresso em tempo real
- ✅ **Reconexão automática** - reconexão automática em falhas de conexão
- ✅ **Verificações de saúde da conexão** - monitorar e validar status da conexão
- ✅ **Operações recursivas** - suporte a diretórios aninhados
- ✅ **Cobertura de testes** - 84%+ de cobertura com 150+ testes
- ✅ **Zero dependências** - apenas as bibliotecas essenciais

### 📦 Instalação

```bash
npm install super-ftp
```

### 🔌 Protocolos Suportados

Esta biblioteca fornece suporte unificado para três protocolos de transferência de arquivos:

#### **FTP** (File Transfer Protocol)

- **Porta**: 21 (padrão)
- **Segurança**: Não criptografado
- **Casos de uso**: Redes internas, sistemas legados
- **String de conexão**: `ftp://user:pass@host.com:21`

#### **FTPS** (FTP sobre TLS/SSL)

- **Porta**: 21 (padrão) ou 990 (implícito)
- **Segurança**: Criptografado usando TLS/SSL
- **Casos de uso**: Transferências seguras de arquivos sobre protocolo FTP
- **String de conexão**: `ftps://user:pass@host.com:21`
- **Recursos**: Suporta opções TLS/SSL (`secureOptions`)

#### **SFTP** (SSH File Transfer Protocol)

- **Porta**: 22 (padrão)
- **Segurança**: Criptografado usando SSH
- **Casos de uso**: Transferências seguras de arquivos, sistemas modernos
- **String de conexão**: `sftp://user:pass@host.com:22`
- **Recursos**: Suporta autenticação por chave privada, configuração de algoritmos SSH

**Notas Importantes:**

- Todos os três protocolos compartilham a **mesma API unificada** - altere protocolos sem mudar seu código
- FTPS usa o mesmo adapter do FTP mas com a flag `secure: true` habilitada
- O protocolo é automaticamente detectado pelo prefixo da string de conexão (`ftp://`, `ftps://`, `sftp://`)

### 🎯 Uso Básico

#### Com String de Conexão (Recomendado)

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

#### Com Opções Avançadas

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

#### Com Objeto de Configuração

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

### ⚙️ Opções Avançadas de Configuração

#### Opções de Conexão

```typescript
interface IConnectionConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  connectionTimeout?: number; // Timeout de conexão em ms (padrão: 30000)
  commandTimeout?: number; // Timeout de comandos em ms (padrão: 30000)
  passive?: boolean; // Usar modo passivo (padrão: true)
  autoReconnect?: boolean; // Reconexão automática em falhas (padrão: true)
  maxReconnectAttempts?: number; // Máximo de tentativas de reconexão (padrão: 3)
  reconnectDelay?: number; // Delay entre tentativas em ms (padrão: 1000)
}
```

#### Opções de Upload/Download com Progresso e Concorrência

```typescript
interface IUploadOptions {
  createDir?: boolean; // Criar diretório se não existir
  mode?: 'binary' | 'ascii'; // Modo de transferência
  onProgress?: (transferred: number, total: number) => void; // Callback de progresso
  concurrency?: number; // Número de operações concorrentes (apenas SFTP, padrão: 64)
  chunkSize?: number; // Tamanho do chunk em bytes (apenas SFTP, padrão: 32768)
}

interface IDownloadOptions {
  mode?: 'binary' | 'ascii'; // Modo de transferência
  onProgress?: (transferred: number, total: number) => void; // Callback de progresso
  concurrency?: number; // Número de operações concorrentes (apenas SFTP, padrão: 64)
  chunkSize?: number; // Tamanho do chunk em bytes (apenas SFTP, padrão: 32768)
}
```

**Exemplo com callbacks de progresso e concorrência (SFTP):**

```typescript
await sftp.upload('/local/arquivo.txt', '/remote/arquivo.txt', {
  onProgress: (transferido, total) => {
    console.log(`Progresso: ${Math.round((transferido / total) * 100)}%`);
  },
  concurrency: 32, // Usar 32 leituras concorrentes (apenas SFTP)
  chunkSize: 65536, // Usar chunks de 64KB (apenas SFTP)
});
```

#### Configuração de Retry

```typescript
interface IConnectionConfig {
  // ... outras opções
  maxRetries?: number; // Máximo de tentativas de retry (padrão: 3)
  retryDelay?: number; // Delay inicial para retry em ms (padrão: 1000)
  retryBackoffMultiplier?: number; // Multiplicador de backoff exponencial (padrão: 2)
}
```

**Exemplo com configuração de retry:**

```typescript
const ftp = new SuperFtp('ftp://user:pass@host.com:21', {
  maxRetries: 5,
  retryDelay: 500,
  retryBackoffMultiplier: 2, // Delays: 500ms, 1000ms, 2000ms, 4000ms, 8000ms
});
```

### 📚 API Completa

#### SuperFtp

Classe principal que abstrai completamente os detalhes dos protocolos. Todas as operações fazem conexão automática (lazy connection).

##### Construtor

```typescript
new SuperFtp(connection: string | IConnectionConfig, advancedOptions?: IAdvancedOptions)
```

**Parâmetros:**

- `connection`: String de conexão (`ftp://user:pass@host:port`) ou objeto de configuração
- `advancedOptions`: Opções avançadas (porta, timeouts, etc) - sobrescreve valores da string

##### Métodos de Conexão

```typescript
// Conecta ao servidor explicitamente (geralmente não necessário)
await ftp.connect(): Promise<void>

// Desconecta do servidor
await ftp.disconnect(): Promise<void>

// Verifica se está conectado
ftp.isConnected(): boolean

// Verificação de saúde da conexão
await ftp.healthCheck(): Promise<boolean>

// Obtém estatísticas da conexão
ftp.getConnectionStats(): {
  connected: boolean;
  hasConnectedBefore: boolean;
  lastActivity: Date;
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  reconnectDelay: number;
}

// Força uma reconexão manual
await ftp.forceReconnect(): Promise<void>
```

##### Métodos de Arquivo

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

// Faz upload recursivo de um diretório
await ftp.uploadDir(
  localDir: string,
  remoteDir: string,
  options?: IUploadOptions
): Promise<void>

// Faz download recursivo de um diretório
await ftp.downloadDir(
  remoteDir: string,
  localDir: string,
  options?: IDownloadOptions
): Promise<void>

// Transferência em lote de múltiplos arquivos com controle de concorrência
await ftp.batchTransfer(
  transfers: IBatchTransfer[],
  maxConcurrency?: number
): Promise<IBatchTransferResult[]>
```

**Exemplo de Transferência em Lote:**

```typescript
const resultados = await ftp.batchTransfer(
  [
    { type: 'upload', localPath: '/local/arquivo1.txt', remotePath: '/remote/arquivo1.txt' },
    { type: 'upload', localPath: '/local/arquivo2.txt', remotePath: '/remote/arquivo2.txt' },
    { type: 'download', localPath: '/local/arquivo3.txt', remotePath: '/remote/arquivo3.txt' },
  ],
  3, // Máximo de 3 transferências simultâneas
);

// Verificar resultados
resultados.forEach((resultado) => {
  if (resultado.success) {
    console.log(`✓ ${resultado.transfer.type} concluído em ${resultado.duration}ms`);
  } else {
    console.error(`✗ ${resultado.transfer.type} falhou: ${resultado.error?.message}`);
  }
});
```

##### Métodos de Diretório

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

##### Métodos de Manipulação

```typescript
// Remove um arquivo
await ftp.delete(path: string): Promise<void>

// Renomeia ou move um arquivo/diretório
await ftp.rename(oldPath: string, newPath: string): Promise<void>
```

### 🔧 Formato de String de Conexão

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

### 💡 Exemplos Práticos

#### Upload e Download Simples

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

#### Trabalhando com Buffers

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

#### Listagem e Navegação

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

#### Operações Recursivas

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

#### Tratamento de Erros

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

### 🏗️ Arquitetura

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

### 🧪 Desenvolvimento

#### Pré-requisitos

- Node.js LTS (versão especificada em `.nvmrc`)
- npm ou yarn

#### Scripts Disponíveis

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

#### Estrutura do Projeto

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

#### Contribuindo

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

### 📊 Cobertura de Testes

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

### 🔒 Segurança

- ✅ Suporte a FTPS (FTP sobre TLS/SSL)
- ✅ Suporte a SFTP (SSH File Transfer Protocol)
- ✅ Opções de segurança configuráveis
- ✅ Validação de certificados TLS
- ✅ Autenticação por chave privada (SFTP)

### 📝 Licença

MIT

### 🤝 Suporte

Para questões, bugs ou sugestões, abra uma issue no repositório.

---

Desenvolvido com ❤️ seguindo as melhores práticas de desenvolvimento.
