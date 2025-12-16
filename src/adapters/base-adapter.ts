import {
  IFtpClient,
  IFtpFileInfo,
  IUploadOptions,
  IDownloadOptions,
  IBatchTransfer,
  IBatchTransferResult,
} from '../interfaces';

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
  protected maxRetries: number = 3;
  protected retryDelay: number = 1000; // ms
  protected retryBackoffMultiplier: number = 2;
  protected config: any;

  /**
   * Inicializa configurações de conexão
   */
  protected initConfig(baseConfig: any): void {
    this.config = baseConfig;
    this.autoReconnect = baseConfig.autoReconnect !== undefined ? baseConfig.autoReconnect : true;
    this.maxReconnectAttempts = baseConfig.maxReconnectAttempts || 3;
    this.reconnectDelay = baseConfig.reconnectDelay || 1000;
    this.maxRetries = baseConfig.maxRetries || 3;
    this.retryDelay = baseConfig.retryDelay || 1000;
    this.retryBackoffMultiplier = baseConfig.retryBackoffMultiplier || 2;
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
   * Executa uma operação com retry logic e backoff exponencial
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries?: number,
    retryDelay?: number,
    backoffMultiplier?: number,
  ): Promise<T> {
    const maxAttempts = maxRetries !== undefined ? maxRetries : this.maxRetries;
    const initialDelay = retryDelay !== undefined ? retryDelay : this.retryDelay;
    const multiplier =
      backoffMultiplier !== undefined ? backoffMultiplier : this.retryBackoffMultiplier;

    let lastError: any;
    let currentDelay = initialDelay;

    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Se não é um erro recuperável ou é a última tentativa, lança o erro
        if (!this.isRetryableError(error) || attempt === maxAttempts) {
          throw error;
        }

        // Aguardar antes de tentar novamente com backoff exponencial
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        currentDelay *= multiplier;
      }
    }

    throw lastError;
  }

  /**
   * Verifica se um erro é recuperável e deve ser tentado novamente
   */
  protected isRetryableError(error: any): boolean {
    const errorMessage = (error.message || String(error)).toLowerCase();

    const retryableErrors = [
      'timeout',
      'connection',
      'network',
      'econnreset',
      'econnrefused',
      'etimedout',
      'socket',
      'temporary',
      '503', // Service Unavailable
      '502', // Bad Gateway
      '504', // Gateway Timeout
    ];

    return retryableErrors.some((msg) => errorMessage.includes(msg));
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
   * Faz transferência em lote de múltiplos arquivos com controle de concorrência
   */
  async batchTransfer(
    transfers: IBatchTransfer[],
    maxConcurrency: number = 5,
  ): Promise<IBatchTransferResult[]> {
    this.ensureConnected();

    const results: IBatchTransferResult[] = [];
    const executing: Promise<void>[] = [];

    for (const transfer of transfers) {
      const promise = this.executeTransfer(transfer).then((result) => {
        results.push(result);
        executing.splice(executing.indexOf(promise), 1);
      });

      executing.push(promise);

      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * Executa uma transferência individual
   */
  private async executeTransfer(transfer: IBatchTransfer): Promise<IBatchTransferResult> {
    const startTime = Date.now();

    try {
      if (transfer.type === 'upload') {
        await this.upload(
          transfer.localPath,
          transfer.remotePath,
          transfer.options as IUploadOptions,
        );
      } else {
        await this.download(
          transfer.remotePath,
          transfer.localPath,
          transfer.options as IDownloadOptions,
        );
      }

      return {
        transfer,
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        transfer,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime,
      };
    }
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
  abstract downloadBuffer(remotePath: string, options?: IDownloadOptions): Promise<Buffer>;

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
