import { FtpAdapter } from '../../src/adapters/ftp-adapter';
import { IFtpConfig } from '../../src/interfaces';
import { Client } from 'basic-ftp';
import { Readable, Writable } from 'stream';

// Mock do basic-ftp
jest.mock('basic-ftp');

describe('FtpAdapter', () => {
  let adapter: FtpAdapter;
  let mockClient: jest.Mocked<Client>;
  let config: IFtpConfig;

  beforeEach(() => {
    // Arrange: Setup mock client
    mockClient = {
      access: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      list: jest.fn().mockResolvedValue([]),
      uploadFrom: jest.fn().mockResolvedValue(undefined),
      downloadTo: jest.fn().mockResolvedValue(undefined),
      uploadFromDir: jest.fn().mockResolvedValue(undefined),
      downloadToDir: jest.fn().mockResolvedValue(undefined),
      ensureDir: jest.fn().mockResolvedValue(undefined),
      removeDir: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      rename: jest.fn().mockResolvedValue(undefined),
      cd: jest.fn().mockResolvedValue(undefined),
      pwd: jest.fn().mockResolvedValue('/'),
      send: jest.fn().mockResolvedValue(undefined),
      ftp: {
        passive: true,
      } as any,
    } as any;

    (Client as jest.Mock).mockImplementation(() => mockClient);

    config = {
      host: 'ftp.example.com',
      port: 21,
      user: 'user',
      password: 'pass',
    };

    adapter = new FtpAdapter(config);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default values', () => {
      // Arrange & Act
      const testAdapter = new FtpAdapter({
        host: 'host.com',
        user: 'user',
        password: 'pass',
      });

      // Assert
      expect(testAdapter).toBeInstanceOf(FtpAdapter);
      expect(Client).toHaveBeenCalled();
    });

    it('should create instance with custom timeout', () => {
      // Arrange & Act
      new FtpAdapter({
        host: 'host.com',
        user: 'user',
        password: 'pass',
        connectionTimeout: 10000,
      });

      // Assert
      expect(Client).toHaveBeenCalledWith(10000);
    });
  });

  describe('connect', () => {
    it('should connect to FTP server', async () => {
      // Arrange
      mockClient.access.mockResolvedValue({} as any);

      // Act
      await adapter.connect();

      // Assert
      expect(mockClient.access).toHaveBeenCalledWith({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        secure: false,
      });
      expect(adapter.isConnected()).toBe(true);
    });

    it('should connect to FTPS server when secure is true', async () => {
      // Arrange
      const secureConfig: IFtpConfig = {
        ...config,
        secure: true,
        secureOptions: {
          rejectUnauthorized: true,
        },
      };
      const secureAdapter = new FtpAdapter(secureConfig);
      mockClient.access.mockResolvedValue({} as any);

      // Act
      await secureAdapter.connect();

      // Assert
      expect(mockClient.access).toHaveBeenCalledWith(
        expect.objectContaining({
          secure: true,
          secureOptions: {
            rejectUnauthorized: true,
          },
        }),
      );
    });

    it('should throw error on connection failure', async () => {
      // Arrange
      const error = new Error('Connection failed');
      mockClient.access.mockRejectedValue(error);

      // Act & Assert
      await expect(adapter.connect()).rejects.toThrow('Failed to connect to FTP server');
      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should disconnect from server', async () => {
      // Arrange
      await adapter.connect();

      // Act
      await adapter.disconnect();

      // Assert
      expect(mockClient.close).toHaveBeenCalled();
      expect(adapter.isConnected()).toBe(false);
    });

    it('should not throw error when already disconnected', async () => {
      // Arrange
      // (not connected)

      // Act & Assert
      await expect(adapter.disconnect()).resolves.not.toThrow();
    });
  });

  describe('list', () => {
    it('should list files in directory', async () => {
      // Arrange
      await adapter.connect();
      const mockFiles = [
        {
          name: 'file1.txt',
          size: 100,
          isDirectory: false,
          modifiedAt: new Date(),
        },
        {
          name: 'dir1',
          size: 0,
          isDirectory: true,
          modifiedAt: new Date(),
        },
      ];
      mockClient.list.mockResolvedValue(mockFiles as any);

      // Act
      const result = await adapter.list('/path');

      // Assert
      expect(mockClient.list).toHaveBeenCalledWith('/path');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('file1.txt');
      expect(result[0].type).toBe('file');
      expect(result[1].type).toBe('directory');
    });

    it('should throw error when not connected', async () => {
      // Arrange
      // (not connected)

      // Act & Assert
      await expect(adapter.list('/path')).rejects.toThrow('Not connected');
    });
  });

  describe('upload', () => {
    it('should upload file', async () => {
      // Arrange
      await adapter.connect();

      // Act
      await adapter.upload('/local/file.txt', '/remote/file.txt');

      // Assert
      expect(mockClient.uploadFrom).toHaveBeenCalledWith('/local/file.txt', '/remote/file.txt');
    });

    it('should create directory before upload when option is set', async () => {
      // Arrange
      await adapter.connect();
      mockClient.ensureDir.mockResolvedValue(undefined);

      // Act
      await adapter.upload('/local/file.txt', '/remote/path/file.txt', {
        createDir: true,
      });

      // Assert
      expect(mockClient.ensureDir).toHaveBeenCalledWith('/remote/path');
      expect(mockClient.uploadFrom).toHaveBeenCalled();
    });
  });

  describe('download', () => {
    it('should download file', async () => {
      // Arrange
      await adapter.connect();

      // Act
      await adapter.download('/remote/file.txt', '/local/file.txt');

      // Assert
      expect(mockClient.downloadTo).toHaveBeenCalledWith('/local/file.txt', '/remote/file.txt');
    });

    it('should set transfer mode to ASCII when specified', async () => {
      // Arrange
      await adapter.connect();
      mockClient.send = jest.fn().mockResolvedValue(undefined);

      // Act
      await adapter.download('/remote/file.txt', '/local/file.txt', { mode: 'ascii' });

      // Assert
      expect(mockClient.send).toHaveBeenCalledWith('TYPE A');
    });
  });

  describe('uploadBuffer', () => {
    it('should upload buffer', async () => {
      // Arrange
      await adapter.connect();
      const buffer = Buffer.from('test content');
      jest.spyOn(Readable, 'from').mockReturnValue({
        pipe: jest.fn(),
      } as any);

      // Act
      await adapter.uploadBuffer(buffer, '/remote/file.txt');

      // Assert
      expect(Readable.from).toHaveBeenCalledWith(buffer);
      expect(mockClient.uploadFrom).toHaveBeenCalled();
    });
  });

  describe('downloadBuffer', () => {
    it('should download to buffer', async () => {
      // Arrange
      await adapter.connect();
      const chunks: Buffer[] = [];
      const mockWrite = jest.fn((chunk: Buffer, _encoding: string, callback: () => void) => {
        chunks.push(chunk);
        callback();
      });
      jest.spyOn(Writable, 'Writable').mockImplementation((_options: any) => {
        return {
          write: mockWrite,
        } as any;
      });

      // Act
      const result = await adapter.downloadBuffer('/remote/file.txt');

      // Assert
      expect(mockClient.downloadTo).toHaveBeenCalled();
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should set transfer mode to ASCII when specified', async () => {
      // Arrange
      await adapter.connect();
      const chunks: Buffer[] = [];
      const mockWrite = jest.fn((chunk: Buffer, _encoding: string, callback: () => void) => {
        chunks.push(chunk);
        callback();
      });
      jest.spyOn(Writable, 'Writable').mockImplementation((_options: any) => {
        return {
          write: mockWrite,
        } as any;
      });
      mockClient.send = jest.fn().mockResolvedValue(undefined);

      // Act
      await adapter.downloadBuffer('/remote/file.txt', { mode: 'ascii' });

      // Assert
      expect(mockClient.send).toHaveBeenCalledWith('TYPE A');
    });
  });

  describe('uploadDir', () => {
    it('should upload directory recursively', async () => {
      // Arrange
      await adapter.connect();

      // Act
      await adapter.uploadDir('/local/dir', '/remote/dir');

      // Assert
      expect(mockClient.uploadFromDir).toHaveBeenCalledWith('/local/dir', '/remote/dir');
    });

    it('should create remote directory if createDir option is true', async () => {
      // Arrange
      await adapter.connect();

      // Act
      await adapter.uploadDir('/local/dir', '/remote/dir', { createDir: true });

      // Assert
      expect(mockClient.ensureDir).toHaveBeenCalledWith('/remote/dir');
      expect(mockClient.uploadFromDir).toHaveBeenCalledWith('/local/dir', '/remote/dir');
    });
  });

  describe('downloadDir', () => {
    it('should download directory recursively', async () => {
      // Arrange
      await adapter.connect();

      // Act
      await adapter.downloadDir('/remote/dir', '/local/dir');

      // Assert
      expect(mockClient.downloadToDir).toHaveBeenCalledWith('/local/dir', '/remote/dir');
    });
  });

  describe('mkdir', () => {
    it('should create directory', async () => {
      // Arrange
      await adapter.connect();

      // Act
      await adapter.mkdir('/new/dir');

      // Assert
      expect(mockClient.ensureDir).toHaveBeenCalledWith('/new/dir');
    });

    it('should create directory recursively', async () => {
      // Arrange
      await adapter.connect();
      mockClient.ensureDir.mockResolvedValue(undefined);

      // Act
      await adapter.mkdir('/deep/nested/path', true);

      // Assert
      expect(mockClient.ensureDir).toHaveBeenCalledTimes(3);
    });
  });

  describe('rmdir', () => {
    it('should remove directory', async () => {
      // Arrange
      await adapter.connect();
      mockClient.list.mockResolvedValue([]);

      // Act
      await adapter.rmdir('/dir');

      // Assert
      expect(mockClient.removeDir).toHaveBeenCalledWith('/dir');
    });

    it('should remove directory recursively', async () => {
      // Arrange
      await adapter.connect();
      mockClient.list.mockResolvedValue([
        { name: 'file.txt', isDirectory: false, size: 100 },
      ] as any);

      // Act
      await adapter.rmdir('/dir', true);

      // Assert
      expect(mockClient.list).toHaveBeenCalled();
      expect(mockClient.remove).toHaveBeenCalled();
      expect(mockClient.removeDir).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete file', async () => {
      // Arrange
      await adapter.connect();

      // Act
      await adapter.delete('/file.txt');

      // Assert
      expect(mockClient.remove).toHaveBeenCalledWith('/file.txt');
    });
  });

  describe('rename', () => {
    it('should rename file', async () => {
      // Arrange
      await adapter.connect();

      // Act
      await adapter.rename('/old.txt', '/new.txt');

      // Assert
      expect(mockClient.rename).toHaveBeenCalledWith('/old.txt', '/new.txt');
    });
  });

  describe('cwd', () => {
    it('should change working directory', async () => {
      // Arrange
      await adapter.connect();

      // Act
      await adapter.cwd('/new/path');

      // Assert
      expect(mockClient.cd).toHaveBeenCalledWith('/new/path');
    });
  });

  describe('pwd', () => {
    it('should get current working directory', async () => {
      // Arrange
      await adapter.connect();
      mockClient.pwd.mockResolvedValue('/current/path');

      // Act
      const result = await adapter.pwd();

      // Assert
      expect(mockClient.pwd).toHaveBeenCalled();
      expect(result).toBe('/current/path');
    });
  });
});
