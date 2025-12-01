import { IFtpClient, IFtpConfig, ISftpConfig } from '../interfaces';
import { ProtocolType } from '../constants';
import { FtpAdapter } from '../adapters/ftp-adapter';
import { SftpAdapter } from '../adapters/sftp-adapter';

/**
 * Factory para criar instâncias de clientes FTP
 * Implementa o padrão Factory para abstrair a criação de adaptadores
 */
export class FtpClientFactory {
  /**
   * Cria um cliente FTP baseado no tipo de protocolo
   */
  static create(protocol: ProtocolType, config: IFtpConfig | ISftpConfig): IFtpClient {
    switch (protocol) {
      case ProtocolType.FTP:
        return new FtpAdapter({ ...config, secure: false } as IFtpConfig);

      case ProtocolType.FTPS:
        return new FtpAdapter({ ...config, secure: true } as IFtpConfig);

      case ProtocolType.SFTP:
        return new SftpAdapter(config as ISftpConfig);

      default:
        throw new Error(`Unsupported protocol: ${protocol}`);
    }
  }

  /**
   * Cria um cliente FTP (não seguro)
   */
  static createFtp(config: IFtpConfig): IFtpClient {
    return new FtpAdapter({ ...config, secure: false });
  }

  /**
   * Cria um cliente FTPS (FTP seguro)
   */
  static createFtps(config: IFtpConfig): IFtpClient {
    return new FtpAdapter({ ...config, secure: true });
  }

  /**
   * Cria um cliente SFTP
   */
  static createSftp(config: ISftpConfig): IFtpClient {
    return new SftpAdapter(config);
  }
}
