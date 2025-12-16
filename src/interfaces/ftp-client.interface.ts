/**
 * Interface base para operações de transferência de arquivos
 * Define o contrato comum para todos os protocolos (FTP, SFTP, FTPS)
 */
export interface IFtpClient {
  /**
   * Conecta ao servidor
   */
  connect(): Promise<void>;

  /**
   * Desconecta do servidor
   */
  disconnect(): Promise<void>;

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean;

  /**
   * Lista arquivos e diretórios em um caminho
   */
  list(path?: string): Promise<IFtpFileInfo[]>;

  /**
   * Obtém informações de um arquivo ou diretório
   */
  getFileInfo(path: string): Promise<IFtpFileInfo | null>;

  /**
   * Faz upload de um arquivo
   */
  upload(localPath: string, remotePath: string, options?: IUploadOptions): Promise<void>;

  /**
   * Faz download de um arquivo
   */
  download(remotePath: string, localPath: string, options?: IDownloadOptions): Promise<void>;

  /**
   * Faz upload de um buffer
   */
  uploadBuffer(buffer: Buffer, remotePath: string, options?: IUploadOptions): Promise<void>;

  /**
   * Faz download para um buffer
   */
  downloadBuffer(remotePath: string): Promise<Buffer>;

  /**
   * Faz upload recursivo de um diretório
   */
  uploadDir(localDir: string, remoteDir: string, options?: IUploadOptions): Promise<void>;

  /**
   * Faz download recursivo de um diretório
   */
  downloadDir(remoteDir: string, localDir: string, options?: IDownloadOptions): Promise<void>;

  /**
   * Cria um diretório
   */
  mkdir(path: string, recursive?: boolean): Promise<void>;

  /**
   * Remove um diretório
   */
  rmdir(path: string, recursive?: boolean): Promise<void>;

  /**
   * Remove um arquivo
   */
  delete(path: string): Promise<void>;

  /**
   * Renomeia ou move um arquivo/diretório
   */
  rename(oldPath: string, newPath: string): Promise<void>;

  /**
   * Verifica se um arquivo ou diretório existe
   */
  exists(path: string): Promise<boolean>;

  /**
   * Altera o diretório de trabalho atual
   */
  cwd(path: string): Promise<void>;

  /**
   * Obtém o diretório de trabalho atual
   */
  pwd(): Promise<string>;

  /**
   * Health check da conexão
   */
  healthCheck(): Promise<boolean>;

  /**
   * Obtém estatísticas da conexão
   */
  getConnectionStats(): {
    connected: boolean;
    hasConnectedBefore: boolean;
    lastActivity: Date;
    autoReconnect: boolean;
    maxReconnectAttempts: number;
    reconnectDelay: number;
  };

  /**
   * Força uma reconexão manual
   */
  forceReconnect(): Promise<void>;

  /**
   * Faz transferência em lote de múltiplos arquivos com controle de concorrência
   * @param transfers Array de transferências a serem executadas
   * @param maxConcurrency Número máximo de transferências simultâneas (padrão: 5)
   */
  batchTransfer(
    transfers: IBatchTransfer[],
    maxConcurrency?: number,
  ): Promise<IBatchTransferResult[]>;
}

/**
 * Informações sobre um arquivo ou diretório
 */
export interface IFtpFileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modifiedTime?: Date;
  permissions?: string;
  owner?: string;
  group?: string;
}

/**
 * Opções para upload
 */
export interface IUploadOptions {
  /**
   * Se deve criar diretórios automaticamente
   */
  createDir?: boolean;

  /**
   * Modo de transferência (binary ou ascii)
   */
  mode?: 'binary' | 'ascii';

  /**
   * Callback de progresso (bytes transferidos, total)
   */
  onProgress?: (transferred: number, total: number) => void;

  /**
   * Número de operações concorrentes (apenas SFTP)
   * Padrão: 64 para SFTP, não suportado para FTP
   */
  concurrency?: number;

  /**
   * Tamanho do chunk em bytes (apenas SFTP)
   * Padrão: 32768 para SFTP, não suportado para FTP
   */
  chunkSize?: number;
}

/**
 * Opções para download
 */
export interface IDownloadOptions {
  /**
   * Modo de transferência (binary ou ascii)
   */
  mode?: 'binary' | 'ascii';

  /**
   * Callback de progresso (bytes transferidos, total)
   */
  onProgress?: (transferred: number, total: number) => void;

  /**
   * Número de operações concorrentes (apenas SFTP)
   * Padrão: 64 para SFTP, não suportado para FTP
   */
  concurrency?: number;

  /**
   * Tamanho do chunk em bytes (apenas SFTP)
   * Padrão: 32768 para SFTP, não suportado para FTP
   */
  chunkSize?: number;
}

/**
 * Configuração base de conexão
 */
export interface IConnectionConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  /**
   * Timeout de conexão em milissegundos
   */
  connectionTimeout?: number;
  /**
   * Timeout de comandos em milissegundos
   */
  commandTimeout?: number;
  /**
   * Se deve usar modo passivo (padrão: true)
   */
  passive?: boolean;
  /**
   * Se deve tentar reconectar automaticamente em caso de falha (padrão: true)
   */
  autoReconnect?: boolean;
  /**
   * Número máximo de tentativas de reconexão (padrão: 3)
   */
  maxReconnectAttempts?: number;
  /**
   * Delay entre tentativas de reconexão em ms (padrão: 1000)
   */
  reconnectDelay?: number;
  /**
   * Número máximo de tentativas de retry para operações (padrão: 3)
   */
  maxRetries?: number;
  /**
   * Delay inicial para retry em ms (padrão: 1000)
   */
  retryDelay?: number;
  /**
   * Multiplicador para backoff exponencial (padrão: 2)
   */
  retryBackoffMultiplier?: number;
}

/**
 * Configuração específica para FTP/FTPS
 */
export interface IFtpConfig extends IConnectionConfig {
  /**
   * Se deve usar FTPS (TLS/SSL)
   */
  secure?: boolean;
  /**
   * Opções TLS/SSL
   */
  secureOptions?: {
    rejectUnauthorized?: boolean;
    minVersion?: string;
    maxVersion?: string;
  };
}

/**
 * Configuração específica para SFTP
 */
export interface ISftpConfig extends IConnectionConfig {
  /**
   * Caminho para chave privada
   */
  privateKey?: string | Buffer;
  /**
   * Passphrase para a chave privada
   */
  passphrase?: string;
  /**
   * Algoritmos permitidos
   */
  algorithms?: {
    kex?: string[];
    cipher?: string[];
    serverHostKey?: string[];
    hmac?: string[];
  };
  /**
   * Se deve verificar o host
   */
  strictVendor?: boolean;
  /**
   * Função para verificar a chave do host (retorna true para aceitar)
   * Útil para aceitar automaticamente chaves desconhecidas em testes
   */
  hostVerifier?: (keyHash: string) => boolean;
}

/**
 * Tipo de transferência em lote
 */
export type BatchTransferType = 'upload' | 'download';

/**
 * Definição de uma transferência individual em lote
 */
export interface IBatchTransfer {
  /**
   * Tipo de transferência
   */
  type: BatchTransferType;

  /**
   * Caminho local (para upload) ou remoto (para download)
   */
  localPath: string;

  /**
   * Caminho remoto (para upload) ou local (para download)
   */
  remotePath: string;

  /**
   * Opções específicas para esta transferência
   */
  options?: IUploadOptions | IDownloadOptions;
}

/**
 * Resultado de uma transferência em lote
 */
export interface IBatchTransferResult {
  /**
   * Transferência original
   */
  transfer: IBatchTransfer;

  /**
   * Se a transferência foi bem-sucedida
   */
  success: boolean;

  /**
   * Erro ocorrido (se houver)
   */
  error?: Error;

  /**
   * Tempo de execução em milissegundos
   */
  duration: number;
}
