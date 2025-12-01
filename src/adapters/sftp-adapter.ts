import SftpClient from 'ssh2-sftp-client';
import { BaseAdapter } from './base-adapter';
import { IFtpFileInfo, ISftpConfig, IUploadOptions, IDownloadOptions } from '../interfaces';
import { DEFAULT_PORTS, DEFAULT_TIMEOUTS } from '../constants';

/**
 * Adaptador para protocolo SFTP usando ssh2-sftp-client
 */
export class SftpAdapter extends BaseAdapter {
  private client: SftpClient;
  private config: ISftpConfig;

  constructor(config: ISftpConfig) {
    super();
    this.config = {
      port: config.port || DEFAULT_PORTS.SFTP,
      connectionTimeout: config.connectionTimeout || DEFAULT_TIMEOUTS.CONNECTION,
      commandTimeout: config.commandTimeout || DEFAULT_TIMEOUTS.COMMAND,
      passive: true, // SFTP sempre usa modo passivo
      ...config,
    };

    this.client = new SftpClient();
  }

  /**
   * Conecta ao servidor SFTP
   */
  async connect(): Promise<void> {
    try {
      const connectionConfig: any = {
        host: this.config.host,
        port: this.config.port,
        username: this.config.user,
        password: this.config.password,
        readyTimeout: this.config.connectionTimeout,
      };

      if (this.config.privateKey) {
        connectionConfig.privateKey = this.config.privateKey;
        if (this.config.passphrase) {
          connectionConfig.passphrase = this.config.passphrase;
        }
      }

      if (this.config.algorithms) {
        connectionConfig.algorithms = this.config.algorithms;
      }

      if (this.config.strictVendor !== undefined) {
        connectionConfig.strictVendor = this.config.strictVendor;
      }

      await this.client.connect(connectionConfig);
      this.connected = true;
    } catch (error: any) {
      this.connected = false;
      throw new Error(`Failed to connect to SFTP server: ${error.message}`);
    }
  }

  /**
   * Desconecta do servidor
   */
  async disconnect(): Promise<void> {
    try {
      if (this.connected) {
        await this.client.end();
        this.connected = false;
      }
    } catch (error: any) {
      throw new Error(`Failed to disconnect from SFTP server: ${error.message}`);
    }
  }

  /**
   * Lista arquivos e diretórios
   */
  async list(path?: string): Promise<IFtpFileInfo[]> {
    this.ensureConnected();

    try {
      const remotePath = path ? this.normalizePath(path) : '.';
      const files = await this.client.list(remotePath);

      return files.map((file: any) => this.mapFileInfo(file, remotePath));
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
      const stats = await this.client.stat(normalizedPath);

      return {
        name: this.getFilename(normalizedPath),
        path: normalizedPath,
        type: stats.isDirectory ? 'directory' : 'file',
        size: stats.size || 0,
        modifiedTime: stats.modifyTime,
        permissions: stats.permissions?.toString(8),
        owner: stats.owner?.toString(),
        group: stats.group?.toString(),
      };
    } catch (error: any) {
      if (error.message.includes('not exist') || error.message.includes('No such file')) {
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

      await this.client.put(localPath, normalizedRemotePath);
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
      await this.client.fastGet(normalizedRemotePath, localPath);
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

      await this.client.put(buffer, normalizedRemotePath);
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
      const buffer = await this.client.get(normalizedRemotePath);
      return buffer as Buffer;
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
            await this.client.mkdir(currentPath, true);
          } catch (error: any) {
            if (!error.message.includes('already exists')) {
              throw error;
            }
          }
        }
      } else {
        await this.client.mkdir(normalizedPath, true);
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

      await this.client.rmdir(normalizedPath, false);
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
      await this.client.delete(normalizedPath);
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
      await this.client.cwd(normalizedPath);
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
   * Mapeia FileInfo do ssh2-sftp-client para IFtpFileInfo
   */
  private mapFileInfo(
    file: {
      name: string;
      type: string;
      size?: number;
      modifyTime?: number;
      permissions?: number;
      owner?: number;
      group?: number;
    },
    basePath: string,
  ): IFtpFileInfo {
    const fullPath =
      basePath === '.' || basePath === '/' ? `/${file.name}` : `${basePath}/${file.name}`;

    return {
      name: file.name,
      path: this.normalizePath(fullPath),
      type: file.type === 'd' ? 'directory' : 'file',
      size: file.size || 0,
      modifiedTime: file.modifyTime ? new Date(file.modifyTime) : undefined,
      permissions: file.permissions?.toString(8),
      owner: file.owner?.toString(),
      group: file.group?.toString(),
    };
  }
}
