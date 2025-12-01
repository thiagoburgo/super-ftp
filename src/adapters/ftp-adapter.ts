import { Client, FileInfo as BasicFtpFileInfo } from 'basic-ftp';
import { BaseAdapter } from './base-adapter';
import { IFtpFileInfo, IFtpConfig, IUploadOptions, IDownloadOptions } from '../interfaces';
import { DEFAULT_PORTS, DEFAULT_TIMEOUTS } from '../constants';
import { Readable, Writable } from 'stream';

/**
 * Adaptador para protocolos FTP e FTPS usando basic-ftp
 */
export class FtpAdapter extends BaseAdapter {
  private client: Client;
  private config: IFtpConfig;

  constructor(config: IFtpConfig) {
    super();
    this.config = {
      port: config.port || DEFAULT_PORTS.FTP,
      connectionTimeout: config.connectionTimeout || DEFAULT_TIMEOUTS.CONNECTION,
      commandTimeout: config.commandTimeout || DEFAULT_TIMEOUTS.COMMAND,
      passive: config.passive !== undefined ? config.passive : true,
      ...config,
    };

    this.client = new Client(this.config.connectionTimeout);
  }

  /**
   * Conecta ao servidor FTP/FTPS
   */
  async connect(): Promise<void> {
    try {
      const accessOptions: any = {
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        secure: this.config.secure || false,
      };

      if (this.config.secure && this.config.secureOptions) {
        accessOptions.secureOptions = this.config.secureOptions as any;
      }

      await this.client.access(accessOptions);

      if (this.config.passive !== undefined) {
        // Configurar modo passivo após conexão
        (this.client as any).ftp.passive = this.config.passive;
      }

      this.connected = true;
    } catch (error: any) {
      this.connected = false;
      throw new Error(`Failed to connect to FTP server: ${error.message}`);
    }
  }

  /**
   * Desconecta do servidor
   */
  async disconnect(): Promise<void> {
    try {
      if (this.connected) {
        this.client.close();
        this.connected = false;
      }
    } catch (error: any) {
      throw new Error(`Failed to disconnect from FTP server: ${error.message}`);
    }
  }

  /**
   * Lista arquivos e diretórios
   */
  async list(path?: string): Promise<IFtpFileInfo[]> {
    this.ensureConnected();

    try {
      const remotePath = path ? this.normalizePath(path) : undefined;
      const files = await this.client.list(remotePath);

      return files.map((file) => this.mapFileInfo(file, remotePath || '/'));
    } catch (error: any) {
      throw new Error(`Failed to list directory: ${error.message}`);
    }
  }

  /**
   * Obtém informações de um arquivo
   */
  async getFileInfo(path: string): Promise<IFtpFileInfo | null> {
    this.ensureConnected();

    try {
      const normalizedPath = this.normalizePath(path);
      const directory = this.getDirectory(normalizedPath);
      const filename = this.getFilename(normalizedPath);

      const files = await this.list(directory);
      const file = files.find((f) => f.name === filename);

      return file || null;
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('No such file')) {
        return null;
      }
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  /**
   * Faz upload de um arquivo
   */
  async upload(localPath: string, remotePath: string, options?: IUploadOptions): Promise<void> {
    this.ensureConnected();

    try {
      const normalizedRemotePath = this.normalizePath(remotePath);

      if (options?.createDir) {
        const dir = this.getDirectory(normalizedRemotePath);
        await this.mkdir(dir, true);
      }

      await this.client.uploadFrom(localPath, normalizedRemotePath);
    } catch (error: any) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Faz download de um arquivo
   */
  async download(
    remotePath: string,
    localPath: string,
    _options?: IDownloadOptions,
  ): Promise<void> {
    this.ensureConnected();

    try {
      const normalizedRemotePath = this.normalizePath(remotePath);
      await this.client.downloadTo(localPath, normalizedRemotePath);
    } catch (error: any) {
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Faz upload de um buffer
   */
  async uploadBuffer(buffer: Buffer, remotePath: string, options?: IUploadOptions): Promise<void> {
    this.ensureConnected();

    try {
      const normalizedRemotePath = this.normalizePath(remotePath);

      if (options?.createDir) {
        const dir = this.getDirectory(normalizedRemotePath);
        await this.mkdir(dir, true);
      }

      // Convert Buffer to Readable stream
      const stream = Readable.from(buffer);
      await this.client.uploadFrom(stream, normalizedRemotePath);
    } catch (error: any) {
      throw new Error(`Failed to upload buffer: ${error.message}`);
    }
  }

  /**
   * Faz download para um buffer
   */
  async downloadBuffer(remotePath: string): Promise<Buffer> {
    this.ensureConnected();

    try {
      const normalizedRemotePath = this.normalizePath(remotePath);
      const chunks: Buffer[] = [];

      const writable = new Writable({
        write(chunk: Buffer, _encoding: string, callback: () => void) {
          chunks.push(chunk);
          callback();
        },
      });

      await this.client.downloadTo(writable, normalizedRemotePath);
      return Buffer.concat(chunks);
    } catch (error: any) {
      throw new Error(`Failed to download buffer: ${error.message}`);
    }
  }

  /**
   * Cria um diretório
   */
  async mkdir(path: string, recursive: boolean = false): Promise<void> {
    this.ensureConnected();

    try {
      const normalizedPath = this.normalizePath(path);

      if (recursive) {
        const parts = normalizedPath.split('/').filter((p) => p);
        let currentPath = '';

        for (const part of parts) {
          currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
          try {
            await this.client.ensureDir(currentPath);
          } catch (error: any) {
            if (!error.message.includes('already exists')) {
              throw error;
            }
          }
        }
      } else {
        await this.client.ensureDir(normalizedPath);
      }
    } catch (error: any) {
      throw new Error(`Failed to create directory: ${error.message}`);
    }
  }

  /**
   * Remove um diretório
   */
  async rmdir(path: string, recursive: boolean = false): Promise<void> {
    this.ensureConnected();

    try {
      const normalizedPath = this.normalizePath(path);

      if (recursive) {
        const files = await this.list(normalizedPath);
        for (const file of files) {
          const fullPath = `${normalizedPath}/${file.name}`;
          if (file.type === 'directory') {
            await this.rmdir(fullPath, true);
          } else {
            await this.delete(fullPath);
          }
        }
      }

      await this.client.removeDir(normalizedPath);
    } catch (error: any) {
      throw new Error(`Failed to remove directory: ${error.message}`);
    }
  }

  /**
   * Remove um arquivo
   */
  async delete(path: string): Promise<void> {
    this.ensureConnected();

    try {
      const normalizedPath = this.normalizePath(path);
      await this.client.remove(normalizedPath);
    } catch (error: any) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Renomeia ou move um arquivo/diretório
   */
  async rename(oldPath: string, newPath: string): Promise<void> {
    this.ensureConnected();

    try {
      const normalizedOldPath = this.normalizePath(oldPath);
      const normalizedNewPath = this.normalizePath(newPath);
      await this.client.rename(normalizedOldPath, normalizedNewPath);
    } catch (error: any) {
      throw new Error(`Failed to rename file: ${error.message}`);
    }
  }

  /**
   * Altera o diretório de trabalho
   */
  async cwd(path: string): Promise<void> {
    this.ensureConnected();

    try {
      const normalizedPath = this.normalizePath(path);
      await this.client.cd(normalizedPath);
    } catch (error: any) {
      throw new Error(`Failed to change directory: ${error.message}`);
    }
  }

  /**
   * Obtém o diretório de trabalho atual
   */
  async pwd(): Promise<string> {
    this.ensureConnected();

    try {
      return await this.client.pwd();
    } catch (error: any) {
      throw new Error(`Failed to get current directory: ${error.message}`);
    }
  }

  /**
   * Mapeia FileInfo do basic-ftp para IFtpFileInfo
   */
  private mapFileInfo(file: BasicFtpFileInfo, basePath: string): IFtpFileInfo {
    const fullPath = basePath === '/' ? `/${file.name}` : `${basePath}/${file.name}`;

    return {
      name: file.name,
      path: this.normalizePath(fullPath),
      type: file.isDirectory ? 'directory' : 'file',
      size: file.size || 0,
      modifiedTime: file.modifiedAt,
      permissions: file.permissions?.toString(),
    };
  }
}
