import { ProtocolType } from '../constants';
import { IFtpConfig, ISftpConfig, IConnectionConfig } from '../interfaces';

/**
 * Opções avançadas para conexão
 */
export interface IAdvancedOptions {
  port?: number;
  connectionTimeout?: number;
  commandTimeout?: number;
  passive?: boolean;
  // Opções específicas FTPS
  secure?: boolean;
  secureOptions?: {
    rejectUnauthorized?: boolean;
    minVersion?: string;
    maxVersion?: string;
  };
  // Opções específicas SFTP
  privateKey?: string | Buffer;
  passphrase?: string;
  algorithms?: {
    kex?: string[];
    cipher?: string[];
    serverHostKey?: string[];
    hmac?: string[];
  };
  strictVendor?: boolean;
  hostVerifier?: (keyHash: string) => boolean;
}

/**
 * Resultado do parsing de string de conexão
 */
export interface IParsedConnection {
  protocol: ProtocolType;
  host: string;
  port?: number;
  user: string;
  password: string;
  options?: IAdvancedOptions;
}

/**
 * Parser de string de conexão FTP
 * Suporta formatos:
 * - ftp://user:pass@host:port
 * - sftp://user:pass@host:port
 * - ftps://user:pass@host:port
 * - ftp://user:pass@host (porta padrão)
 */
export class ConnectionParser {
  /**
   * Parse uma string de conexão
   */
  static parse(connectionString: string, advancedOptions?: IAdvancedOptions): IParsedConnection {
    try {
      // Remove espaços e normaliza
      const normalized = connectionString.trim();

      // Extrai protocolo
      let protocol: ProtocolType;
      let urlString: string;

      if (normalized.startsWith('ftp://')) {
        protocol = ProtocolType.FTP;
        urlString = normalized;
      } else if (normalized.startsWith('ftps://')) {
        protocol = ProtocolType.FTPS;
        urlString = normalized;
      } else if (normalized.startsWith('sftp://')) {
        protocol = ProtocolType.SFTP;
        urlString = normalized;
      } else {
        // Se não tem protocolo, assume FTP
        protocol = ProtocolType.FTP;
        urlString = `ftp://${normalized}`;
      }

      // Parse URL - para protocolos não padrão, fazemos parsing manual
      let host: string;
      let port: number | undefined;
      let user: string;
      let password: string;

      try {
        // Tenta usar URL nativo primeiro
        const url = new URL(urlString);
        host = url.hostname;
        port = url.port ? parseInt(url.port, 10) : undefined;
        user = url.username ? decodeURIComponent(url.username) : '';
        password = url.password ? decodeURIComponent(url.password) : '';
      } catch {
        // Se falhar (protocolo não reconhecido), faz parsing manual
        const match = urlString.match(
          /^[^:]+:\/\/(?:([^:]+):([^@]+)@)?([^:\/]+)(?::(\d+))?(?:\/.*)?$/,
        );
        if (!match) {
          throw new Error('Invalid URL format');
        }
        user = match[1] ? decodeURIComponent(match[1]) : '';
        password = match[2] ? decodeURIComponent(match[2]) : '';
        host = match[3];
        port = match[4] ? parseInt(match[4], 10) : undefined;
      }

      // Validações básicas
      if (!host) {
        throw new Error('Host is required in connection string');
      }

      // Merge com opções avançadas
      const finalPort = advancedOptions?.port || port;
      const finalOptions: IAdvancedOptions = {
        ...advancedOptions,
        port: finalPort,
      };

      // Se é FTPS e não especificou secure nas opções, assume true
      if (protocol === ProtocolType.FTPS && finalOptions.secure === undefined) {
        finalOptions.secure = true;
      }

      return {
        protocol,
        host,
        port: finalPort,
        user,
        password,
        options: finalOptions,
      };
    } catch (error: any) {
      throw new Error(
        `Invalid connection string: ${error.message}. Expected format: ftp://user:pass@host:port or sftp://user:pass@host:port`,
      );
    }
  }

  /**
   * Converte parsed connection para configuração
   */
  static toConfig(parsed: IParsedConnection): IFtpConfig | ISftpConfig {
    const baseConfig: IConnectionConfig = {
      host: parsed.host,
      port: parsed.port,
      user: parsed.user,
      password: parsed.password,
      connectionTimeout: parsed.options?.connectionTimeout,
      commandTimeout: parsed.options?.commandTimeout,
      passive: parsed.options?.passive,
    };

    if (parsed.protocol === ProtocolType.SFTP) {
      const sftpConfig: ISftpConfig = {
        ...baseConfig,
        privateKey: parsed.options?.privateKey,
        passphrase: parsed.options?.passphrase,
        algorithms: parsed.options?.algorithms,
        strictVendor: parsed.options?.strictVendor,
      };
      return sftpConfig;
    } else {
      const ftpConfig: IFtpConfig = {
        ...baseConfig,
        secure: parsed.protocol === ProtocolType.FTPS || parsed.options?.secure || false,
        secureOptions: parsed.options?.secureOptions,
      };
      return ftpConfig;
    }
  }
}
