// Mock do ssh2-sftp-client - DEVE vir antes dos imports
const mockSftpClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  end: jest.fn().mockResolvedValue(undefined),
  list: jest.fn().mockResolvedValue([]),
  stat: jest.fn().mockResolvedValue(null),
  put: jest.fn().mockResolvedValue(undefined),
  fastGet: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue(Buffer.from('content')),
  mkdir: jest.fn().mockResolvedValue(undefined),
  rmdir: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined),
  rename: jest.fn().mockResolvedValue(undefined),
  cwd: jest.fn().mockResolvedValue(undefined),
  pwd: jest.fn().mockResolvedValue('/'),
};

// Mock deve ser criado antes de importar o adapter
jest.mock('ssh2-sftp-client', () => {
  return jest.fn().mockImplementation(() => mockSftpClient);
});

import { SftpAdapter } from '../../src/adapters/sftp-adapter';
import { ISftpConfig } from '../../src/interfaces';

describe('SftpAdapter', () => {
  let adapter: SftpAdapter;
  let config: ISftpConfig;

  beforeEach(() => {
    // Arrange: Setup config
    config = {
      host: 'sftp.example.com',
      port: 22,
      user: 'user',
      password: 'pass',
    };

    // Reset mock before each test
    jest.clearAllMocks();
    mockSftpClient.connect.mockResolvedValue(undefined);

    adapter = new SftpAdapter(config);
  });

  describe('constructor', () => {
    it('should create instance with default values', () => {
      // Arrange & Act
      const adapter = new SftpAdapter({
        host: 'host.com',
        user: 'user',
        password: 'pass',
      });

      // Assert
      expect(adapter).toBeInstanceOf(SftpAdapter);
    });

    it('should create instance with private key', () => {
      // Arrange & Act
      const adapter = new SftpAdapter({
        host: 'host.com',
        user: 'user',
        password: 'pass',
        privateKey: Buffer.from('key'),
        passphrase: 'secret',
      });

      // Assert
      expect(adapter).toBeInstanceOf(SftpAdapter);
    });
  });

  describe('connect', () => {
    it('should connect to SFTP server', async () => {
      // Arrange
      mockSftpClient.connect.mockResolvedValue(undefined);

      // Act
      await adapter.connect();

      // Assert
      expect(mockSftpClient.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          host: config.host,
          port: config.port,
          username: config.user,
          password: config.password,
        }),
      );
      expect(adapter.isConnected()).toBe(true);
    });

    it('should connect with private key', async () => {
      // Arrange
      const keyConfig: ISftpConfig = {
        ...config,
        privateKey: Buffer.from('private-key'),
        passphrase: 'secret',
      };
      const keyAdapter = new SftpAdapter(keyConfig);

      // Act
      await keyAdapter.connect();

      // Assert
      expect(mockSftpClient.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          privateKey: Buffer.from('private-key'),
          passphrase: 'secret',
        }),
      );
    });

    it('should throw error on connection failure', async () => {
      // Arrange
      const error = new Error('Connection failed');
      mockSftpClient.connect.mockRejectedValue(error);

      // Act & Assert
      await expect(adapter.connect()).rejects.toThrow('Failed to connect to SFTP server');
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
      expect(mockSftpClient.end).toHaveBeenCalled();
      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('list', () => {
    it('should list files in directory', async () => {
      // Arrange
      await adapter.connect();
      const mockFiles = [
        {
          name: 'file1.txt',
          type: 'f',
          size: 100,
          modifyTime: Date.now(),
          permissions: 0o644,
        },
        {
          name: 'dir1',
          type: 'd',
          size: 0,
          modifyTime: Date.now(),
        },
      ];
      mockSftpClient.list.mockResolvedValue(mockFiles as any);

      // Act
      const result = await adapter.list('/path');

      // Assert
      expect(mockSftpClient.list).toHaveBeenCalledWith('/path');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('file1.txt');
      expect(result[0].type).toBe('file');
      expect(result[1].type).toBe('directory');
    });
  });

  describe('getFileInfo', () => {
    it('should get file info', async () => {
      // Arrange
      await adapter.connect();
      const mockStats = {
        isDirectory: false,
        size: 1024,
        modifyTime: Date.now(),
        permissions: 0o644,
        owner: 1000,
        group: 1000,
      };
      mockSftpClient.stat.mockResolvedValue(mockStats as any);

      // Act
      const result = await adapter.getFileInfo('/file.txt');

      // Assert
      expect(mockSftpClient.stat).toHaveBeenCalledWith('/file.txt');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('file');
      expect(result?.size).toBe(1024);
    });

    it('should return null when file does not exist', async () => {
      // Arrange
      await adapter.connect();
      const error = new Error('File does not exist');
      mockSftpClient.stat.mockRejectedValue(error);

      // Act
      const result = await adapter.getFileInfo('/nonexistent.txt');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('upload', () => {
    it('should upload file', async () => {
      // Arrange
      await adapter.connect();

      // Act
      await adapter.upload('/local/file.txt', '/remote/file.txt');

      // Assert
      expect(mockSftpClient.put).toHaveBeenCalledWith('/local/file.txt', '/remote/file.txt');
    });

    it('should create directory before upload when option is set', async () => {
      // Arrange
      await adapter.connect();
      mockSftpClient.mkdir.mockResolvedValue(undefined);

      // Act
      await adapter.upload('/local/file.txt', '/remote/path/file.txt', {
        createDir: true,
      });

      // Assert
      expect(mockSftpClient.mkdir).toHaveBeenCalled();
      expect(mockSftpClient.put).toHaveBeenCalled();
    });
  });

  describe('download', () => {
    it('should download file', async () => {
      // Arrange
      await adapter.connect();

      // Act
      await adapter.download('/remote/file.txt', '/local/file.txt');

      // Assert
      expect(mockSftpClient.fastGet).toHaveBeenCalledWith('/remote/file.txt', '/local/file.txt');
    });
  });

  describe('uploadBuffer', () => {
    it('should upload buffer', async () => {
      // Arrange
      await adapter.connect();
      const buffer = Buffer.from('test content');

      // Act
      await adapter.uploadBuffer(buffer, '/remote/file.txt');

      // Assert
      expect(mockSftpClient.put).toHaveBeenCalledWith(buffer, '/remote/file.txt');
    });
  });

  describe('downloadBuffer', () => {
    it('should download to buffer', async () => {
      // Arrange
      await adapter.connect();
      const expectedBuffer = Buffer.from('file content');
      mockSftpClient.get.mockResolvedValue(expectedBuffer);

      // Act
      const result = await adapter.downloadBuffer('/remote/file.txt');

      // Assert
      expect(mockSftpClient.get).toHaveBeenCalledWith('/remote/file.txt');
      expect(result).toEqual(expectedBuffer);
    });
  });

  describe('mkdir', () => {
    it('should create directory', async () => {
      // Arrange
      await adapter.connect();

      // Act
      await adapter.mkdir('/new/dir');

      // Assert
      expect(mockSftpClient.mkdir).toHaveBeenCalledWith('/new/dir', true);
    });

    it('should create directory recursively', async () => {
      // Arrange
      await adapter.connect();
      mockSftpClient.mkdir.mockResolvedValue(undefined);

      // Act
      await adapter.mkdir('/deep/nested/path', true);

      // Assert
      expect(mockSftpClient.mkdir).toHaveBeenCalledTimes(3);
    });
  });

  describe('rmdir', () => {
    it('should remove directory', async () => {
      // Arrange
      await adapter.connect();
      // Mock exists() para retornar true (diretório existe)
      mockSftpClient.stat.mockResolvedValue({ isDirectory: true } as any);
      mockSftpClient.list.mockResolvedValue([]);

      // Act
      await adapter.rmdir('/dir');

      // Assert
      expect(mockSftpClient.stat).toHaveBeenCalledWith('/dir');
      expect(mockSftpClient.rmdir).toHaveBeenCalledWith('/dir', false);
    });

    it('should remove directory recursively', async () => {
      // Arrange
      await adapter.connect();
      // Mock exists() para retornar true (diretório existe)
      mockSftpClient.stat.mockResolvedValue({ isDirectory: true } as any);
      mockSftpClient.list.mockResolvedValue([{ name: 'file.txt', type: 'file' }] as any);

      // Act
      await adapter.rmdir('/dir', true);

      // Assert
      expect(mockSftpClient.stat).toHaveBeenCalledWith('/dir');
      expect(mockSftpClient.list).toHaveBeenCalledWith('/dir');
      expect(mockSftpClient.delete).toHaveBeenCalled();
      expect(mockSftpClient.rmdir).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete file', async () => {
      // Arrange
      await adapter.connect();

      // Act
      await adapter.delete('/file.txt');

      // Assert
      expect(mockSftpClient.delete).toHaveBeenCalledWith('/file.txt');
    });
  });

  describe('rename', () => {
    it('should rename file', async () => {
      // Arrange
      await adapter.connect();

      // Act
      await adapter.rename('/old.txt', '/new.txt');

      // Assert
      expect(mockSftpClient.rename).toHaveBeenCalledWith('/old.txt', '/new.txt');
    });
  });

  describe('cwd', () => {
    it('should change working directory', async () => {
      // Arrange
      await adapter.connect();
      // Mock exists() para retornar true (diretório existe)
      mockSftpClient.stat.mockResolvedValue({ isDirectory: true } as any);

      // Act
      await adapter.cwd('/new/path');

      // Assert
      expect(mockSftpClient.stat).toHaveBeenCalledWith('/new/path');
      // cwd apenas valida que o diretório existe, não chama cwd() do client
    });
  });

  describe('pwd', () => {
    it('should get current working directory', async () => {
      // Arrange
      await adapter.connect();
      // pwd() usa client.cwd() sem parâmetros, que retorna uma Promise<string>
      mockSftpClient.cwd.mockResolvedValue('/current/path');

      // Act
      const result = await adapter.pwd();

      // Assert
      expect(mockSftpClient.cwd).toHaveBeenCalledWith();
      expect(result).toBe('/current/path');
    });
  });
});
