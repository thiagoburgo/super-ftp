import { IFtpClient, IFtpFileInfo, IUploadOptions, IDownloadOptions } from '../interfaces';

/**
 * Classe base abstrata para adaptadores de protocolos FTP
 * Implementa padrões comuns e delega operações específicas para subclasses
 */
export abstract class BaseAdapter implements IFtpClient {
  protected connected: boolean = false;

  /**
   * Conecta ao servidor
   */
  abstract connect(): Promise<void>;

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
