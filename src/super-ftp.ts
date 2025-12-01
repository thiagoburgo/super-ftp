import { IFtpClient, IFtpConfig, ISftpConfig, IConnectionConfig } from './interfaces';
import { ProtocolType } from './constants';
import { FtpClientFactory } from './factories';
import { ConnectionParser, IAdvancedOptions } from './utils/connection-parser';

/**
 * Tipo de entrada para construtor do SuperFtp
 */
export type SuperFtpConnectionInput =
  | string
  | (IConnectionConfig & { protocol?: 'ftp' | 'ftps' | 'sftp' });

/**
 * Classe principal SuperFtp
 * Abstrai completamente os detalhes de implementação dos protocolos
 * O usuário só precisa passar uma string de conexão e usar as operações
 */
export class SuperFtp {
  private client: IFtpClient | null = null;
  private protocol: ProtocolType;
  private config: IFtpConfig | ISftpConfig;

  /**
   * Construtor do SuperFtp
   * @param connection - String de conexão (ftp://user:pass@host:port) ou objeto de configuração
   * @param advancedOptions - Opções avançadas (porta, timeouts, etc) - sobrescreve valores da string
   */
  constructor(connection: SuperFtpConnectionInput, advancedOptions?: IAdvancedOptions) {
    if (typeof connection === 'string') {
      // Parse string de conexão
      const parsed = ConnectionParser.parse(connection, advancedOptions);
      this.protocol = parsed.protocol;
      this.config = ConnectionParser.toConfig(parsed);
    } else {
      // Objeto de configuração
      const protocolStr = connection.protocol || 'ftp';
      this.protocol =
        protocolStr === 'sftp'
          ? ProtocolType.SFTP
          : protocolStr === 'ftps'
            ? ProtocolType.FTPS
            : ProtocolType.FTP;

      // Merge com opções avançadas
      const mergedConfig = {
        ...connection,
        ...advancedOptions,
        port: advancedOptions?.port || connection.port,
      };

      if (this.protocol === ProtocolType.SFTP) {
        this.config = mergedConfig as ISftpConfig;
      } else {
        const ftpConfig: IFtpConfig = {
          ...mergedConfig,
          secure: this.protocol === ProtocolType.FTPS || mergedConfig.secure || false,
          secureOptions: advancedOptions?.secureOptions,
        };
        this.config = ftpConfig;
      }
    }
  }

  /**
   * Conecta ao servidor
   */
  async connect(): Promise<void> {
    if (this.client && this.client.isConnected()) {
      return;
    }

    this.client = FtpClientFactory.create(this.protocol, this.config);
    await this.client.connect();
  }

  /**
   * Desconecta do servidor
   */
  async disconnect(): Promise<void> {
    if (this.client && this.client.isConnected()) {
      await this.client.disconnect();
    }
    this.client = null;
  }

  /**
   * Obtém o cliente FTP
   * Conecta automaticamente se não estiver conectado (lazy connection)
   */
  private async getClient(): Promise<IFtpClient> {
    if (!this.client || !this.client.isConnected()) {
      await this.connect();
    }
    if (!this.client) {
      throw new Error('Failed to create FTP client');
    }
    return this.client;
  }

  /**
   * Executa uma operação com conexão automática
   */
  private async execute<T>(operation: (client: IFtpClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    return operation(client);
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.client?.isConnected() || false;
  }

  /**
   * Lista arquivos e diretórios
   */
  async list(path?: string): Promise<import('./interfaces').IFtpFileInfo[]> {
    return this.execute((client) => client.list(path));
  }

  /**
   * Obtém informações de um arquivo ou diretório
   */
  async getFileInfo(path: string): Promise<import('./interfaces').IFtpFileInfo | null> {
    return this.execute((client) => client.getFileInfo(path));
  }

  /**
   * Faz upload de um arquivo
   */
  async upload(
    localPath: string,
    remotePath: string,
    options?: import('./interfaces').IUploadOptions,
  ): Promise<void> {
    return this.execute((client) => client.upload(localPath, remotePath, options));
  }

  /**
   * Faz download de um arquivo
   */
  async download(
    remotePath: string,
    localPath: string,
    options?: import('./interfaces').IDownloadOptions,
  ): Promise<void> {
    return this.execute((client) => client.download(remotePath, localPath, options));
  }

  /**
   * Faz upload de um buffer
   */
  async uploadBuffer(
    buffer: Buffer,
    remotePath: string,
    options?: import('./interfaces').IUploadOptions,
  ): Promise<void> {
    return this.execute((client) => client.uploadBuffer(buffer, remotePath, options));
  }

  /**
   * Faz download para um buffer
   */
  async downloadBuffer(remotePath: string): Promise<Buffer> {
    return this.execute((client) => client.downloadBuffer(remotePath));
  }

  /**
   * Cria um diretório
   */
  async mkdir(path: string, recursive?: boolean): Promise<void> {
    return this.execute((client) => client.mkdir(path, recursive));
  }

  /**
   * Remove um diretório
   */
  async rmdir(path: string, recursive?: boolean): Promise<void> {
    return this.execute((client) => client.rmdir(path, recursive));
  }

  /**
   * Remove um arquivo
   */
  async delete(path: string): Promise<void> {
    return this.execute((client) => client.delete(path));
  }

  /**
   * Renomeia ou move um arquivo/diretório
   */
  async rename(oldPath: string, newPath: string): Promise<void> {
    return this.execute((client) => client.rename(oldPath, newPath));
  }

  /**
   * Verifica se um arquivo ou diretório existe
   */
  async exists(path: string): Promise<boolean> {
    return this.execute((client) => client.exists(path));
  }

  /**
   * Altera o diretório de trabalho atual
   */
  async cwd(path: string): Promise<void> {
    return this.execute((client) => client.cwd(path));
  }

  /**
   * Obtém o diretório de trabalho atual
   */
  async pwd(): Promise<string> {
    return this.execute((client) => client.pwd());
  }
}
