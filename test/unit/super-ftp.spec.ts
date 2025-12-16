import { SuperFtp } from '../../src/super-ftp';
import { FtpClientFactory } from '../../src/factories/ftp-client.factory';
import { IFtpClient, IFtpFileInfo } from '../../src/interfaces';

// Mock do FtpClientFactory
jest.mock('../../src/factories/ftp-client.factory');

describe('SuperFtp', () => {
  let mockClient: jest.Mocked<IFtpClient>;

  beforeEach(() => {
    // Arrange: Setup mock client
    mockClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(false),
      list: jest.fn().mockResolvedValue([]),
      getFileInfo: jest.fn().mockResolvedValue(null),
      upload: jest.fn().mockResolvedValue(undefined),
      download: jest.fn().mockResolvedValue(undefined),
      uploadBuffer: jest.fn().mockResolvedValue(undefined),
      downloadBuffer: jest.fn().mockResolvedValue(Buffer.from('test')),
      mkdir: jest.fn().mockResolvedValue(undefined),
      rmdir: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      rename: jest.fn().mockResolvedValue(undefined),
      exists: jest.fn().mockResolvedValue(false),
      cwd: jest.fn().mockResolvedValue(undefined),
      pwd: jest.fn().mockResolvedValue('/'),
    } as any;

    (FtpClientFactory.create as jest.Mock).mockReturnValue(mockClient);
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    describe('with connection string', () => {
      it('should create instance with FTP connection string', () => {
        // Arrange & Act
        const ftp = new SuperFtp('ftp://user:pass@host.com:21');

        // Assert
        expect(ftp).toBeInstanceOf(SuperFtp);
        expect(ftp.isConnected()).toBe(false);
      });

      it('should create instance with SFTP connection string', () => {
        // Arrange & Act
        const sftp = new SuperFtp('sftp://user:pass@host.com:22');

        // Assert
        expect(sftp).toBeInstanceOf(SuperFtp);
      });

      it('should create instance with FTPS connection string', () => {
        // Arrange & Act
        const ftps = new SuperFtp('ftps://user:pass@host.com:21');

        // Assert
        expect(ftps).toBeInstanceOf(SuperFtp);
      });

      it('should accept advanced options that override connection string', () => {
        // Arrange & Act
        const ftp = new SuperFtp('ftp://user:pass@host.com:21', {
          port: 2121,
          connectionTimeout: 5000,
          commandTimeout: 10000,
        });

        // Assert
        expect(ftp).toBeInstanceOf(SuperFtp);
      });

      it('should handle connection string without port', () => {
        // Arrange & Act
        const ftp = new SuperFtp('ftp://user:pass@host.com');

        // Assert
        expect(ftp).toBeInstanceOf(SuperFtp);
      });

      it('should handle connection string without user credentials', () => {
        // Arrange & Act
        const ftp = new SuperFtp('ftp://host.com:21');

        // Assert
        expect(ftp).toBeInstanceOf(SuperFtp);
      });
    });

    describe('with config object', () => {
      it('should create instance with FTP config', () => {
        // Arrange & Act
        const ftp = new SuperFtp({
          protocol: 'ftp',
          host: 'host.com',
          port: 21,
          user: 'user',
          password: 'pass',
        });

        // Assert
        expect(ftp).toBeInstanceOf(SuperFtp);
      });

      it('should create instance with SFTP config', () => {
        // Arrange & Act
        const sftp = new SuperFtp({
          protocol: 'sftp',
          host: 'host.com',
          port: 22,
          user: 'user',
          password: 'pass',
        });

        // Assert
        expect(sftp).toBeInstanceOf(SuperFtp);
      });

      it('should create instance with FTPS config', () => {
        // Arrange & Act
        const ftps = new SuperFtp({
          protocol: 'ftps',
          host: 'host.com',
          port: 21,
          user: 'user',
          password: 'pass',
        });

        // Assert
        expect(ftps).toBeInstanceOf(SuperFtp);
      });

      it('should default to FTP when protocol is not specified', () => {
        // Arrange & Act
        const ftp = new SuperFtp({
          host: 'host.com',
          port: 21,
          user: 'user',
          password: 'pass',
        });

        // Assert
        expect(ftp).toBeInstanceOf(SuperFtp);
      });

      it('should merge advanced options with config object', () => {
        // Arrange & Act
        const ftp = new SuperFtp(
          {
            protocol: 'ftp',
            host: 'host.com',
            user: 'user',
            password: 'pass',
          },
          {
            port: 2121,
            connectionTimeout: 5000,
          },
        );

        // Assert
        expect(ftp).toBeInstanceOf(SuperFtp);
      });
    });
  });

  describe('Connection Management', () => {
    let ftp: SuperFtp;

    beforeEach(() => {
      ftp = new SuperFtp('ftp://user:pass@host.com:21');
    });

    it('should connect to server when connect() is called', async () => {
      // Arrange
      mockClient.isConnected.mockReturnValue(false);
      mockClient.connect.mockResolvedValue(undefined);

      // Act
      await ftp.connect();

      // Assert
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
      expect(FtpClientFactory.create).toHaveBeenCalled();
    });

    it('should not reconnect if already connected', async () => {
      // Arrange
      mockClient.isConnected.mockReturnValue(true);
      await ftp.connect();

      // Act
      await ftp.connect();

      // Assert
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
    });

    it('should disconnect from server', async () => {
      // Arrange
      mockClient.isConnected.mockReturnValue(true);
      await ftp.connect();

      // Act
      await ftp.disconnect();

      // Assert
      expect(mockClient.disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle disconnect when not connected', async () => {
      // Arrange
      mockClient.isConnected.mockReturnValue(false);

      // Act
      await ftp.disconnect();

      // Assert
      expect(mockClient.disconnect).not.toHaveBeenCalled();
    });

    it('should return connection status correctly', async () => {
      // Arrange
      mockClient.isConnected.mockReturnValue(false);

      // Act
      const isConnected = ftp.isConnected();

      // Assert
      expect(isConnected).toBe(false);
      // Note: isConnected() doesn't call mockClient.isConnected() if client is null
    });
  });

  describe('File Operations', () => {
    let ftp: SuperFtp;

    beforeEach(() => {
      ftp = new SuperFtp('ftp://user:pass@host.com:21');
    });

    describe('list', () => {
      it('should list files in directory with auto-connect', async () => {
        // Arrange
        const expectedFiles: IFtpFileInfo[] = [
          { name: 'file1.txt', path: '/file1.txt', type: 'file', size: 100 },
          { name: 'file2.txt', path: '/file2.txt', type: 'file', size: 200 },
        ];
        mockClient.list.mockResolvedValue(expectedFiles);

        // Act
        const result = await ftp.list('/path');

        // Assert
        expect(mockClient.connect).toHaveBeenCalled();
        expect(mockClient.list).toHaveBeenCalledWith('/path');
        expect(result).toEqual(expectedFiles);
      });

      it('should list files in root when path is not provided', async () => {
        // Arrange
        mockClient.list.mockResolvedValue([]);

        // Act
        await ftp.list();

        // Assert
        expect(mockClient.list).toHaveBeenCalledWith(undefined);
      });

      it('should handle errors during list operation', async () => {
        // Arrange
        const error = new Error('Connection failed');
        mockClient.connect.mockRejectedValue(error);

        // Act & Assert
        await expect(ftp.list('/path')).rejects.toThrow('Connection failed');
      });
    });

    describe('getFileInfo', () => {
      it('should get file info with auto-connect', async () => {
        // Arrange
        const expectedInfo: IFtpFileInfo = {
          name: 'file.txt',
          path: '/file.txt',
          type: 'file',
          size: 1024,
          modifiedTime: new Date(),
        };
        mockClient.getFileInfo.mockResolvedValue(expectedInfo);

        // Act
        const result = await ftp.getFileInfo('/file.txt');

        // Assert
        expect(mockClient.connect).toHaveBeenCalled();
        expect(mockClient.getFileInfo).toHaveBeenCalledWith('/file.txt');
        expect(result).toEqual(expectedInfo);
      });

      it('should return null when file does not exist', async () => {
        // Arrange
        mockClient.getFileInfo.mockResolvedValue(null);

        // Act
        const result = await ftp.getFileInfo('/nonexistent.txt');

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('upload', () => {
      it('should upload file with auto-connect', async () => {
        // Arrange
        const localPath = '/local/file.txt';
        const remotePath = '/remote/file.txt';

        // Act
        await ftp.upload(localPath, remotePath);

        // Assert
        expect(mockClient.connect).toHaveBeenCalled();
        expect(mockClient.upload).toHaveBeenCalledWith(localPath, remotePath, undefined);
      });

      it('should upload file with options', async () => {
        // Arrange
        const options = { createDir: true, mode: 'binary' as const };

        // Act
        await ftp.upload('/local/file.txt', '/remote/file.txt', options);

        // Assert
        expect(mockClient.upload).toHaveBeenCalledWith(
          '/local/file.txt',
          '/remote/file.txt',
          options,
        );
      });

      it('should handle upload errors', async () => {
        // Arrange
        const error = new Error('Upload failed');
        mockClient.upload.mockRejectedValue(error);

        // Act & Assert
        await expect(ftp.upload('/local/file.txt', '/remote/file.txt')).rejects.toThrow(
          'Upload failed',
        );
      });
    });

    describe('download', () => {
      it('should download file with auto-connect', async () => {
        // Arrange
        const remotePath = '/remote/file.txt';
        const localPath = '/local/file.txt';

        // Act
        await ftp.download(remotePath, localPath);

        // Assert
        expect(mockClient.connect).toHaveBeenCalled();
        expect(mockClient.download).toHaveBeenCalledWith(remotePath, localPath, undefined);
      });

      it('should download file with options', async () => {
        // Arrange
        const options = { mode: 'binary' as const };

        // Act
        await ftp.download('/remote/file.txt', '/local/file.txt', options);

        // Assert
        expect(mockClient.download).toHaveBeenCalledWith(
          '/remote/file.txt',
          '/local/file.txt',
          options,
        );
      });
    });

    describe('uploadBuffer', () => {
      it('should upload buffer with auto-connect', async () => {
        // Arrange
        const buffer = Buffer.from('test content');
        const remotePath = '/remote/file.txt';

        // Act
        await ftp.uploadBuffer(buffer, remotePath);

        // Assert
        expect(mockClient.connect).toHaveBeenCalled();
        expect(mockClient.uploadBuffer).toHaveBeenCalledWith(buffer, remotePath, undefined);
      });

      it('should upload buffer with options', async () => {
        // Arrange
        const buffer = Buffer.from('test');
        const options = { createDir: true };

        // Act
        await ftp.uploadBuffer(buffer, '/remote/file.txt', options);

        // Assert
        expect(mockClient.uploadBuffer).toHaveBeenCalledWith(buffer, '/remote/file.txt', options);
      });
    });

    describe('downloadBuffer', () => {
      it('should download to buffer with auto-connect', async () => {
        // Arrange
        const expectedBuffer = Buffer.from('file content');
        mockClient.downloadBuffer.mockResolvedValue(expectedBuffer);

        // Act
        const result = await ftp.downloadBuffer('/remote/file.txt');

        // Assert
        expect(mockClient.connect).toHaveBeenCalled();
        expect(mockClient.downloadBuffer).toHaveBeenCalledWith('/remote/file.txt', undefined);
        expect(result).toEqual(expectedBuffer);
      });
    });
  });

  describe('Directory Operations', () => {
    let ftp: SuperFtp;

    beforeEach(() => {
      ftp = new SuperFtp('ftp://user:pass@host.com:21');
    });

    describe('mkdir', () => {
      it('should create directory with auto-connect', async () => {
        // Arrange
        const path = '/new/directory';

        // Act
        await ftp.mkdir(path);

        // Assert
        expect(mockClient.connect).toHaveBeenCalled();
        expect(mockClient.mkdir).toHaveBeenCalledWith(path, undefined);
      });

      it('should create directory recursively', async () => {
        // Arrange
        const path = '/deep/nested/directory';

        // Act
        await ftp.mkdir(path, true);

        // Assert
        expect(mockClient.mkdir).toHaveBeenCalledWith(path, true);
      });
    });

    describe('rmdir', () => {
      it('should remove directory with auto-connect', async () => {
        // Arrange
        const path = '/directory';

        // Act
        await ftp.rmdir(path);

        // Assert
        expect(mockClient.connect).toHaveBeenCalled();
        expect(mockClient.rmdir).toHaveBeenCalledWith(path, undefined);
      });

      it('should remove directory recursively', async () => {
        // Arrange
        const path = '/directory';

        // Act
        await ftp.rmdir(path, true);

        // Assert
        expect(mockClient.rmdir).toHaveBeenCalledWith(path, true);
      });
    });
  });

  describe('File Management', () => {
    let ftp: SuperFtp;

    beforeEach(() => {
      ftp = new SuperFtp('ftp://user:pass@host.com:21');
    });

    describe('delete', () => {
      it('should delete file with auto-connect', async () => {
        // Arrange
        const path = '/file.txt';

        // Act
        await ftp.delete(path);

        // Assert
        expect(mockClient.connect).toHaveBeenCalled();
        expect(mockClient.delete).toHaveBeenCalledWith(path);
      });
    });

    describe('rename', () => {
      it('should rename file with auto-connect', async () => {
        // Arrange
        const oldPath = '/old-file.txt';
        const newPath = '/new-file.txt';

        // Act
        await ftp.rename(oldPath, newPath);

        // Assert
        expect(mockClient.connect).toHaveBeenCalled();
        expect(mockClient.rename).toHaveBeenCalledWith(oldPath, newPath);
      });
    });

    describe('exists', () => {
      it('should check if file exists with auto-connect', async () => {
        // Arrange
        mockClient.exists.mockResolvedValue(true);

        // Act
        const result = await ftp.exists('/file.txt');

        // Assert
        expect(mockClient.connect).toHaveBeenCalled();
        expect(mockClient.exists).toHaveBeenCalledWith('/file.txt');
        expect(result).toBe(true);
      });

      it('should return false when file does not exist', async () => {
        // Arrange
        mockClient.exists.mockResolvedValue(false);

        // Act
        const result = await ftp.exists('/nonexistent.txt');

        // Assert
        expect(result).toBe(false);
      });
    });
  });

  describe('Working Directory Operations', () => {
    let ftp: SuperFtp;

    beforeEach(() => {
      ftp = new SuperFtp('ftp://user:pass@host.com:21');
    });

    describe('cwd', () => {
      it('should change working directory with auto-connect', async () => {
        // Arrange
        const path = '/new/directory';

        // Act
        await ftp.cwd(path);

        // Assert
        expect(mockClient.connect).toHaveBeenCalled();
        expect(mockClient.cwd).toHaveBeenCalledWith(path);
      });
    });

    describe('pwd', () => {
      it('should get current working directory with auto-connect', async () => {
        // Arrange
        const expectedPath = '/current/directory';
        mockClient.pwd.mockResolvedValue(expectedPath);

        // Act
        const result = await ftp.pwd();

        // Assert
        expect(mockClient.connect).toHaveBeenCalled();
        expect(mockClient.pwd).toHaveBeenCalled();
        expect(result).toBe(expectedPath);
      });
    });
  });

  describe('Error Handling', () => {
    let ftp: SuperFtp;

    beforeEach(() => {
      ftp = new SuperFtp('ftp://user:pass@host.com:21');
    });

    it('should handle connection errors gracefully', async () => {
      // Arrange
      const error = new Error('Connection timeout');
      mockClient.connect.mockRejectedValue(error);

      // Act & Assert
      await expect(ftp.list('/path')).rejects.toThrow('Connection timeout');
    });

    it('should handle operation errors after successful connection', async () => {
      // Arrange
      const error = new Error('Operation failed');
      mockClient.connect.mockResolvedValue(undefined);
      mockClient.list.mockRejectedValue(error);

      // Act & Assert
      await expect(ftp.list('/path')).rejects.toThrow('Operation failed');
    });

    it('should throw error if client creation fails', async () => {
      // Arrange
      (FtpClientFactory.create as jest.Mock).mockReturnValue(null);
      mockClient.connect.mockRejectedValue(new Error('Connection failed'));

      // Act & Assert
      await expect(ftp.connect()).rejects.toThrow();
    });
  });
});
