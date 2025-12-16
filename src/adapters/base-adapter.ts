import { IFtpClient, IFtpFileInfo, IUploadOptions, IDownloadOptions } from '../interfaces';

/**
 * Classe base abstrata para adaptadores de protocolos FTP
 * Implementa padrões comuns e delega operações específicas para subclasses
 */
export abstract class BaseAdapter implements IFtpClient {
  protected connected: boolean = false;
  protected hasConnectedBefore: boolean = false;
  protected lastActivity: Date = new Date();
  protected autoReconnect: boolean = true;
  protected maxReconnectAttempts: number = 3;
  protected reconnectDelay: number = 1000; // ms
  protected config: any;

  /**
   * Inicializa configurações de conexão
   */
  protected initConfig(baseConfig: any): void {
    this.config = baseConfig;
    this.autoReconnect = baseConfig.autoReconnect !== undefined ? baseConfig.autoReconnect : true;
    this.maxReconnectAttempts = baseConfig.maxReconnectAttempts || 3;
    this.reconnectDelay = baseConfig.reconnectDelay || 1000;
  }

  /**
   * Conecta ao servidor
   */
  async connect(): Promise<void> {
    await this._connect();
    this.hasConnectedBefore = true;
  }

  /**
   * Implementação específica de conexão para subclasses
   */
  protected abstract _connect(): Promise<void>;

  /**
   * Desconecta do servidor
   */
  abstract disconnect(): Promise<void>;

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Executa uma operação com auto-reconnect se necessário
   */
  protected async executeWithReconnect<T>(operation: () => Promise<T>): Promise<T> {
    this.updateActivity();

    try {
      return await operation();
    } catch (error: any) {
      // Só tentar reconectar se já houve uma conexão bem-sucedida anteriormente
      if (this.shouldAttemptReconnect(error) && this.hasConnectedBefore) {
        await this.attemptReconnect();
        // Tentar novamente após reconnect
        return await operation();
      }
      throw error;
    }
  }

  /**
   * Atualiza timestamp da última atividade
   */
  protected updateActivity(): void {
    this.lastActivity = new Date();
  }

  /**
   * Verifica se deve tentar reconectar baseado no erro
   */
  protected shouldAttemptReconnect(error: any): boolean {
    if (!this.autoReconnect || this.connected) {
      return false;
    }

    const errorMessage = error.message?.toLowerCase() || '';
    const reconnectableErrors = [
      'connection closed',
      'connection reset',
      'connection lost',
      'socket hang up',
      'timeout',
      'not connected',
    ];

    return reconnectableErrors.some((msg) => errorMessage.includes(msg));
  }

  /**
   * Tenta reconectar com retry limitado
   */
  protected async attemptReconnect(): Promise<void> {
    for (let attempt = 1; attempt <= this.maxReconnectAttempts; attempt++) {
      try {
        await this.connect();
        return; // Sucesso
      } catch (error) {
        if (attempt === this.maxReconnectAttempts) {
          throw new Error(
            `Failed to reconnect after ${this.maxReconnectAttempts} attempts: ${error.message}`,
          );
        }
        // Aguardar antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, this.reconnectDelay * attempt));
      }
    }
  }

  /**
   * Health check da conexão
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.pwd(); // Comando simples para testar conexão
      this.updateActivity();
      return true;
    } catch {
      this.connected = false;
      return false;
    }
  }

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
  } {
    return {
      connected: this.connected,
      hasConnectedBefore: this.hasConnectedBefore,
      lastActivity: this.lastActivity,
      autoReconnect: this.autoReconnect,
      maxReconnectAttempts: this.maxReconnectAttempts,
      reconnectDelay: this.reconnectDelay,
    };
  }

  /**
   * Força uma reconexão manual
   */
  async forceReconnect(): Promise<void> {
    await this.disconnect();
    await this.connect();
  }

  /**
   * Valida se está conectado antes de executar operações
   */
  protected ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Not connected to server. Call connect() first.');
    }
  }

  /**
   * Lista arquivos e diretórios
   */
  abstract list(path?: string): Promise<IFtpFileInfo[]>;

  /**
   * Obtém informações de um arquivo
   */
  abstract getFileInfo(path: string): Promise<IFtpFileInfo | null>;

  /**
   * Faz upload de um arquivo
   */
  abstract upload(localPath: string, remotePath: string, options?: IUploadOptions): Promise<void>;

  /**
   * Faz download de um arquivo
   */
  abstract download(
    remotePath: string,
    localPath: string,
    options?: IDownloadOptions,
  ): Promise<void>;

  /**
   * Faz upload de um buffer
   */
  abstract uploadBuffer(
    buffer: Buffer,
    remotePath: string,
    options?: IUploadOptions,
  ): Promise<void>;

  /**
   * Faz download para um buffer
   */
  abstract downloadBuffer(remotePath: string): Promise<Buffer>;

  /**
   * Faz upload recursivo de um diretório
   */
  abstract uploadDir(localDir: string, remoteDir: string, options?: IUploadOptions): Promise<void>;

  /**
   * Faz download recursivo de um diretório
   */
  abstract downloadDir(
    remoteDir: string,
    localDir: string,
    options?: IDownloadOptions,
  ): Promise<void>;

  /**
   * Cria um diretório
   */
  abstract mkdir(path: string, recursive?: boolean): Promise<void>;

  /**
   * Remove um diretório
   */
  abstract rmdir(path: string, recursive?: boolean): Promise<void>;

  /**
   * Remove um arquivo
   */
  abstract delete(path: string): Promise<void>;

  /**
   * Renomeia ou move um arquivo/diretório
   */
  abstract rename(oldPath: string, newPath: string): Promise<void>;

  /**
   * Verifica se um arquivo ou diretório existe
   */
  async exists(path: string): Promise<boolean> {
    try {
      const info = await this.getFileInfo(path);
      return info !== null;
    } catch {
      return false;
    }
  }

  /**
   * Altera o diretório de trabalho
   */
  abstract cwd(path: string): Promise<void>;

  /**
   * Obtém o diretório de trabalho atual
   */
  abstract pwd(): Promise<string>;

  /**
   * Normaliza caminho removendo barras duplicadas e normalizando separadores
   */
  protected normalizePath(path: string): string {
    return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  }

  /**
   * Extrai o diretório de um caminho
   */
  protected getDirectory(path: string): string {
    const normalized = this.normalizePath(path);
    const lastSlash = normalized.lastIndexOf('/');
    if (lastSlash < 0) {
      return '/';
    }
    const dir = normalized.substring(0, lastSlash);
    return dir || '/';
  }

  /**
   * Extrai o nome do arquivo de um caminho
   */
  protected getFilename(path: string): string {
    const normalized = this.normalizePath(path);
    const lastSlash = normalized.lastIndexOf('/');
    return lastSlash >= 0 ? normalized.substring(lastSlash + 1) : normalized;
  }
}
