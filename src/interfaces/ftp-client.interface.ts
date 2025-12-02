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
