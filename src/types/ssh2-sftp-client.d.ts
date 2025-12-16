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
    compress?: boolean;
    algorithms?: {
      kex?: string[];
      cipher?: string[];
      serverHostKey?: string[];
      hmac?: string[];
      compress?: string[];
    };
    strictVendor?: boolean;
    readyTimeout?: number;
    hostVerifier?: (keyHash: string) => boolean;
  }

  interface TransferOptions {
    concurrency?: number;
    chunkSize?: number;
    step?: (totalTransferred: number, chunk: number, total: number) => void;
  }

  interface DirTransferOptions {
    filter?: (path: string, isDirectory: boolean) => boolean;
    useFastput?: boolean;
    useFastget?: boolean;
  }

  class SftpClient {
    connect(options: ConnectOptions): Promise<void>;
    end(): Promise<void>;
    list(path: string): Promise<FileInfo[]>;
    stat(path: string): Promise<any>;
    put(localPath: string | Buffer, remotePath: string): Promise<void>;
    fastGet(remotePath: string, localPath: string, options?: TransferOptions): Promise<void>;
    fastPut(localPath: string, remotePath: string, options?: TransferOptions): Promise<void>;
    get(remotePath: string): Promise<Buffer>;
    uploadDir(srcDir: string, dstDir: string, options?: DirTransferOptions): Promise<void>;
    downloadDir(srcDir: string, dstDir: string, options?: DirTransferOptions): Promise<void>;
    mkdir(path: string, recursive: boolean): Promise<void>;
    rmdir(path: string, recursive: boolean): Promise<void>;
    delete(path: string): Promise<void>;
    rename(oldPath: string, newPath: string): Promise<void>;
    cwd(path?: string): Promise<string | void>;
    realPath(remotePath: string): Promise<string>;
  }

  export = SftpClient;
}
