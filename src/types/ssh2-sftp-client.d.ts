declare module 'ssh2-sftp-client' {
  interface FileInfo {
    name: string;
    type: string;
    size?: number;
    modifyTime?: number;
    permissions?: number;
    owner?: number;
    group?: number;
  }

  interface ConnectOptions {
    host: string;
    port?: number;
    username: string;
    password?: string;
    privateKey?: string | Buffer;
    passphrase?: string;
    algorithms?: {
      kex?: string[];
      cipher?: string[];
      serverHostKey?: string[];
      hmac?: string[];
    };
    strictVendor?: boolean;
    readyTimeout?: number;
  }

  class SftpClient {
    connect(options: ConnectOptions): Promise<void>;
    end(): Promise<void>;
    list(path: string): Promise<FileInfo[]>;
    stat(path: string): Promise<any>;
    put(localPath: string | Buffer, remotePath: string): Promise<void>;
    fastGet(remotePath: string, localPath: string): Promise<void>;
    get(remotePath: string): Promise<Buffer>;
    mkdir(path: string, recursive: boolean): Promise<void>;
    rmdir(path: string, recursive: boolean): Promise<void>;
    delete(path: string): Promise<void>;
    rename(oldPath: string, newPath: string): Promise<void>;
    cwd(path: string): Promise<void>;
    pwd(): Promise<string>;
  }

  export = SftpClient;
}
