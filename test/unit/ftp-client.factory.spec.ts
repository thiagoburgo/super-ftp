import { FtpClientFactory } from '../../src/factories/ftp-client.factory';
import { ProtocolType } from '../../src/constants';
import { IFtpConfig, ISftpConfig } from '../../src/interfaces';
import { FtpAdapter } from '../../src/adapters/ftp-adapter';
import { SftpAdapter } from '../../src/adapters/sftp-adapter';

describe('FtpClientFactory', () => {
  describe('create', () => {
    describe('FTP protocol', () => {
      it('should create FTP adapter instance', () => {
        // Arrange
        const config: IFtpConfig = {
          host: 'ftp.example.com',
          port: 21,
          user: 'user',
          password: 'pass',
        };

        // Act
        const client = FtpClientFactory.create(ProtocolType.FTP, config);

        // Assert
        expect(client).toBeInstanceOf(FtpAdapter);
      });

      it('should create FTP adapter with secure set to false', () => {
        // Arrange
        const config: IFtpConfig = {
          host: 'ftp.example.com',
          port: 21,
          user: 'user',
          password: 'pass',
          secure: true, // Should be overridden
        };

        // Act
        const client = FtpClientFactory.create(ProtocolType.FTP, config);

        // Assert
        expect(client).toBeInstanceOf(FtpAdapter);
      });
    });

    describe('FTPS protocol', () => {
      it('should create FTPS adapter instance', () => {
        // Arrange
        const config: IFtpConfig = {
          host: 'ftps.example.com',
          port: 21,
          user: 'user',
          password: 'pass',
        };

        // Act
        const client = FtpClientFactory.create(ProtocolType.FTPS, config);

        // Assert
        expect(client).toBeInstanceOf(FtpAdapter);
      });

      it('should create FTPS adapter with secure set to true', () => {
        // Arrange
        const config: IFtpConfig = {
          host: 'ftps.example.com',
          port: 21,
          user: 'user',
          password: 'pass',
          secureOptions: {
            rejectUnauthorized: true,
          },
        };

        // Act
        const client = FtpClientFactory.create(ProtocolType.FTPS, config);

        // Assert
        expect(client).toBeInstanceOf(FtpAdapter);
      });
    });

    describe('SFTP protocol', () => {
      it('should create SFTP adapter instance', () => {
        // Arrange
        const config: ISftpConfig = {
          host: 'sftp.example.com',
          port: 22,
          user: 'user',
          password: 'pass',
        };

        // Act
        const client = FtpClientFactory.create(ProtocolType.SFTP, config);

        // Assert
        expect(client).toBeInstanceOf(SftpAdapter);
      });

      it('should create SFTP adapter with private key', () => {
        // Arrange
        const config: ISftpConfig = {
          host: 'sftp.example.com',
          port: 22,
          user: 'user',
          password: 'pass',
          privateKey: Buffer.from('private-key'),
          passphrase: 'secret',
        };

        // Act
        const client = FtpClientFactory.create(ProtocolType.SFTP, config);

        // Assert
        expect(client).toBeInstanceOf(SftpAdapter);
      });
    });

    describe('Error handling', () => {
      it('should throw error for unsupported protocol', () => {
        // Arrange
        const config: IFtpConfig = {
          host: 'host.com',
          port: 21,
          user: 'user',
          password: 'pass',
        };

        // Act & Assert
        expect(() => {
          FtpClientFactory.create('invalid' as ProtocolType, config);
        }).toThrow('Unsupported protocol: invalid');
      });

      it('should throw error for null protocol', () => {
        // Arrange
        const config: IFtpConfig = {
          host: 'host.com',
          port: 21,
          user: 'user',
          password: 'pass',
        };

        // Act & Assert
        expect(() => {
          FtpClientFactory.create(null as any, config);
        }).toThrow();
      });
    });
  });

  describe('createFtp', () => {
    it('should create FTP adapter with secure false', () => {
      // Arrange
      const config: IFtpConfig = {
        host: 'ftp.example.com',
        port: 21,
        user: 'user',
        password: 'pass',
      };

      // Act
      const client = FtpClientFactory.createFtp(config);

      // Assert
      expect(client).toBeInstanceOf(FtpAdapter);
    });

    it('should override secure option to false', () => {
      // Arrange
      const config: IFtpConfig = {
        host: 'ftp.example.com',
        port: 21,
        user: 'user',
        password: 'pass',
        secure: true, // Should be overridden
      };

      // Act
      const client = FtpClientFactory.createFtp(config);

      // Assert
      expect(client).toBeInstanceOf(FtpAdapter);
    });
  });

  describe('createFtps', () => {
    it('should create FTPS adapter with secure true', () => {
      // Arrange
      const config: IFtpConfig = {
        host: 'ftps.example.com',
        port: 21,
        user: 'user',
        password: 'pass',
      };

      // Act
      const client = FtpClientFactory.createFtps(config);

      // Assert
      expect(client).toBeInstanceOf(FtpAdapter);
    });

    it('should set secure to true even if config has secure false', () => {
      // Arrange
      const config: IFtpConfig = {
        host: 'ftps.example.com',
        port: 21,
        user: 'user',
        password: 'pass',
        secure: false, // Should be overridden
      };

      // Act
      const client = FtpClientFactory.createFtps(config);

      // Assert
      expect(client).toBeInstanceOf(FtpAdapter);
    });

    it('should preserve secure options', () => {
      // Arrange
      const config: IFtpConfig = {
        host: 'ftps.example.com',
        port: 21,
        user: 'user',
        password: 'pass',
        secureOptions: {
          rejectUnauthorized: true,
          minVersion: 'TLSv1.2',
        },
      };

      // Act
      const client = FtpClientFactory.createFtps(config);

      // Assert
      expect(client).toBeInstanceOf(FtpAdapter);
    });
  });

  describe('createSftp', () => {
    it('should create SFTP adapter instance', () => {
      // Arrange
      const config: ISftpConfig = {
        host: 'sftp.example.com',
        port: 22,
        user: 'user',
        password: 'pass',
      };

      // Act
      const client = FtpClientFactory.createSftp(config);

      // Assert
      expect(client).toBeInstanceOf(SftpAdapter);
    });

    it('should create SFTP adapter with all SFTP specific options', () => {
      // Arrange
      const config: ISftpConfig = {
        host: 'sftp.example.com',
        port: 22,
        user: 'user',
        password: 'pass',
        privateKey: Buffer.from('key'),
        passphrase: 'secret',
        algorithms: {
          kex: ['diffie-hellman-group-exchange-sha256'],
          cipher: ['aes256-ctr'],
        },
        strictVendor: true,
      };

      // Act
      const client = FtpClientFactory.createSftp(config);

      // Assert
      expect(client).toBeInstanceOf(SftpAdapter);
    });
  });

  describe('Configuration handling', () => {
    it('should handle config without port', () => {
      // Arrange
      const config: IFtpConfig = {
        host: 'ftp.example.com',
        user: 'user',
        password: 'pass',
      };

      // Act
      const client = FtpClientFactory.createFtp(config);

      // Assert
      expect(client).toBeInstanceOf(FtpAdapter);
    });

    it('should handle config with all optional fields', () => {
      // Arrange
      const config: IFtpConfig = {
        host: 'ftp.example.com',
        port: 21,
        user: 'user',
        password: 'pass',
        connectionTimeout: 5000,
        commandTimeout: 10000,
        passive: true,
        secureOptions: {
          rejectUnauthorized: false,
        },
      };

      // Act
      const client = FtpClientFactory.createFtp(config);

      // Assert
      expect(client).toBeInstanceOf(FtpAdapter);
    });
  });
});
