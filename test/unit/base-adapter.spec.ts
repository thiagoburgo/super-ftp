import { BaseAdapter } from '../../src/adapters/base-adapter';
import { IFtpFileInfo, IBatchTransfer } from '../../src/interfaces';

/**
 * Test adapter implementation for testing BaseAdapter
 */
class TestAdapter extends BaseAdapter {
  protected async _connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async list(_path?: string): Promise<IFtpFileInfo[]> {
    return [];
  }

  async getFileInfo(_path: string): Promise<IFtpFileInfo | null> {
    return null;
  }

  async upload(_localPath: string, _remotePath: string): Promise<void> {
    // Mock implementation
  }

  async download(_remotePath: string, _localPath: string): Promise<void> {
    // Mock implementation
  }

  async uploadBuffer(_buffer: Buffer, _remotePath: string): Promise<void> {
    // Mock implementation
  }

  async downloadBuffer(_remotePath: string): Promise<Buffer> {
    return Buffer.from('');
  }

  async uploadDir(_localDir: string, _remoteDir: string): Promise<void> {
    // Mock implementation
  }

  async downloadDir(_remoteDir: string, _localDir: string): Promise<void> {
    // Mock implementation
  }

  async healthCheck(): Promise<boolean> {
    return this.connected;
  }

  getConnectionStats() {
    return {
      connected: this.connected,
      hasConnectedBefore: false,
      lastActivity: new Date(),
      autoReconnect: true,
      maxReconnectAttempts: 3,
      reconnectDelay: 1000,
    };
  }

  async forceReconnect(): Promise<void> {
    await this.disconnect();
    await this.connect();
  }

  async mkdir(_path: string, _recursive?: boolean): Promise<void> {
    // Mock implementation
  }

  async rmdir(_path: string, _recursive?: boolean): Promise<void> {
    // Mock implementation
  }

  async delete(_path: string): Promise<void> {
    // Mock implementation
  }

  async rename(_oldPath: string, _newPath: string): Promise<void> {
    // Mock implementation
  }

  async cwd(_path: string): Promise<void> {
    // Mock implementation
  }

  async pwd(): Promise<string> {
    return '/';
  }
}

describe('BaseAdapter', () => {
  let adapter: TestAdapter;

  beforeEach(() => {
    // Arrange
    adapter = new TestAdapter();
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      // Arrange
      // (adapter is already created in beforeEach)

      // Act
      const result = adapter.isConnected();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when connected', async () => {
      // Arrange
      // (adapter is already created in beforeEach)

      // Act
      await adapter.connect();
      const result = adapter.isConnected();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false after disconnect', async () => {
      // Arrange
      await adapter.connect();

      // Act
      await adapter.disconnect();
      const result = adapter.isConnected();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return false when file does not exist', async () => {
      // Arrange
      const filePath = '/path/to/nonexistent/file.txt';
      jest.spyOn(adapter, 'getFileInfo').mockResolvedValue(null);

      // Act
      const result = await adapter.exists(filePath);

      // Assert
      expect(adapter.getFileInfo).toHaveBeenCalledWith(filePath);
      expect(result).toBe(false);
    });

    it('should return true when file exists', async () => {
      // Arrange
      const filePath = '/path/to/file.txt';
      const fileInfo: IFtpFileInfo = {
        name: 'file.txt',
        path: filePath,
        type: 'file',
        size: 100,
      };
      jest.spyOn(adapter, 'getFileInfo').mockResolvedValue(fileInfo);

      // Act
      const result = await adapter.exists(filePath);

      // Assert
      expect(adapter.getFileInfo).toHaveBeenCalledWith(filePath);
      expect(result).toBe(true);
    });

    it('should return false when getFileInfo throws error', async () => {
      // Arrange
      const filePath = '/path/to/file.txt';
      jest.spyOn(adapter, 'getFileInfo').mockRejectedValue(new Error('File not found'));

      // Act
      const result = await adapter.exists(filePath);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when directory exists', async () => {
      // Arrange
      const dirPath = '/path/to/directory';
      const dirInfo: IFtpFileInfo = {
        name: 'directory',
        path: dirPath,
        type: 'directory',
        size: 0,
      };
      jest.spyOn(adapter, 'getFileInfo').mockResolvedValue(dirInfo);

      // Act
      const result = await adapter.exists(dirPath);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('normalizePath', () => {
    it('should remove duplicate slashes', () => {
      // Arrange
      const path = '/path/to//file';

      // Act
      const result = adapter['normalizePath'](path);

      // Assert
      expect(result).toBe('/path/to/file');
    });

    it('should remove trailing slash', () => {
      // Arrange
      const path = '/path/to/dir/';

      // Act
      const result = adapter['normalizePath'](path);

      // Assert
      expect(result).toBe('/path/to/dir');
    });

    it('should handle multiple slashes at start', () => {
      // Arrange
      const path = '//path/to/file';

      // Act
      const result = adapter['normalizePath'](path);

      // Assert
      expect(result).toBe('/path/to/file');
    });

    it('should handle root path', () => {
      // Arrange
      const path = '/';

      // Act
      const result = adapter['normalizePath'](path);

      // Assert
      expect(result).toBe('/');
    });

    it('should handle empty path', () => {
      // Arrange
      const path = '';

      // Act
      const result = adapter['normalizePath'](path);

      // Assert
      expect(result).toBe('/');
    });

    it('should handle path with multiple slashes', () => {
      // Arrange
      const path = '/path///to////file';

      // Act
      const result = adapter['normalizePath'](path);

      // Assert
      expect(result).toBe('/path/to/file');
    });
  });

  describe('getDirectory', () => {
    it('should extract directory from file path', () => {
      // Arrange
      const path = '/path/to/file.txt';

      // Act
      const result = adapter['getDirectory'](path);

      // Assert
      expect(result).toBe('/path/to');
    });

    it('should return root for file in root', () => {
      // Arrange
      const path = '/file.txt';

      // Act
      const result = adapter['getDirectory'](path);

      // Assert
      expect(result).toBe('/');
    });

    it('should handle path ending with slash', () => {
      // Arrange
      const path = '/path/to/';

      // Act
      const result = adapter['getDirectory'](path);

      // Assert
      expect(result).toBe('/path');
    });

    it('should handle nested directory path', () => {
      // Arrange
      const path = '/very/deep/nested/path/file.txt';

      // Act
      const result = adapter['getDirectory'](path);

      // Assert
      expect(result).toBe('/very/deep/nested/path');
    });
  });

  describe('getFilename', () => {
    it('should extract filename from full path', () => {
      // Arrange
      const path = '/path/to/file.txt';

      // Act
      const result = adapter['getFilename'](path);

      // Assert
      expect(result).toBe('file.txt');
    });

    it('should extract filename from root path', () => {
      // Arrange
      const path = '/file.txt';

      // Act
      const result = adapter['getFilename'](path);

      // Assert
      expect(result).toBe('file.txt');
    });

    it('should handle path ending with slash', () => {
      // Arrange
      const path = '/path/';

      // Act
      const result = adapter['getFilename'](path);

      // Assert
      expect(result).toBe('path');
    });

    it('should handle filename without extension', () => {
      // Arrange
      const path = '/path/to/filename';

      // Act
      const result = adapter['getFilename'](path);

      // Assert
      expect(result).toBe('filename');
    });

    it('should handle filename with multiple dots', () => {
      // Arrange
      const path = '/path/to/file.backup.txt';

      // Act
      const result = adapter['getFilename'](path);

      // Assert
      expect(result).toBe('file.backup.txt');
    });
  });

  describe('ensureConnected', () => {
    it('should throw error when not connected', () => {
      // Arrange
      // (adapter is not connected)

      // Act & Assert
      expect(() => {
        adapter['ensureConnected']();
      }).toThrow('Not connected to server');
    });

    it('should not throw when connected', async () => {
      // Arrange
      await adapter.connect();

      // Act & Assert
      expect(() => {
        adapter['ensureConnected']();
      }).not.toThrow();
    });
  });

  describe('batchTransfer', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    afterEach(() => {
      // Clean up any mocks
      jest.restoreAllMocks();
    });

    it('should execute multiple transfers successfully', async () => {
      // Arrange
      const transfers: IBatchTransfer[] = [
        { type: 'upload', localPath: '/local/file1.txt', remotePath: '/remote/file1.txt' },
        { type: 'upload', localPath: '/local/file2.txt', remotePath: '/remote/file2.txt' },
        { type: 'download', localPath: '/local/file3.txt', remotePath: '/remote/file3.txt' },
      ];

      // Act
      const results = await adapter.batchTransfer(transfers);

      // Assert
      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
      expect(results[0].transfer).toEqual(transfers[0]);
      expect(results[1].transfer).toEqual(transfers[1]);
      expect(results[2].transfer).toEqual(transfers[2]);
    });

    it('should handle transfer failures gracefully', async () => {
      // Arrange - create a new adapter instance to avoid state pollution
      const testAdapter = new TestAdapter();
      await testAdapter.connect();

      // Create a class that throws on second call
      class FailingTestAdapter extends TestAdapter {
        private callCount = 0;
        async upload(_localPath: string, _remotePath: string): Promise<void> {
          this.callCount++;
          if (this.callCount === 2) {
            throw new Error('File not found');
          }
          // First call succeeds
        }
      }

      const failingAdapter = new FailingTestAdapter();
      await failingAdapter.connect();

      const transfers: IBatchTransfer[] = [
        { type: 'upload', localPath: '/local/file1.txt', remotePath: '/remote/file1.txt' },
        { type: 'upload', localPath: '/nonexistent/file.txt', remotePath: '/remote/file2.txt' },
      ];

      // Act
      const results = await failingAdapter.batchTransfer(transfers);

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeDefined();
      expect(results[1].error?.message).toContain('File not found');
    });

    it('should respect maxConcurrency limit', async () => {
      // Arrange
      const transfers: IBatchTransfer[] = Array.from({ length: 10 }, (_, i) => ({
        type: 'upload' as const,
        localPath: `/local/file${i}.txt`,
        remotePath: `/remote/file${i}.txt`,
      }));

      let maxConcurrent = 0;
      let currentConcurrent = 0;

      // Mock upload to track concurrency
      const originalUpload = adapter.upload.bind(adapter);
      const mockUpload = jest.fn().mockImplementation(async () => {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
        await new Promise((resolve) => setTimeout(resolve, 10));
        currentConcurrent--;
        return originalUpload('/local/file.txt', '/remote/file.txt');
      });
      adapter.upload = mockUpload;

      try {
        // Act
        await adapter.batchTransfer(transfers, 3);

        // Assert
        expect(maxConcurrent).toBeLessThanOrEqual(3);
      } finally {
        // Restore original upload
        adapter.upload = originalUpload;
      }
    });
  });

  describe('executeWithRetry', () => {
    beforeEach(async () => {
      await adapter.connect();
    });

    it('should retry on retryable errors', async () => {
      // Arrange
      let attempts = 0;
      const operation = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Connection timeout');
        }
        return 'success';
      });

      // Act
      const result = await adapter['executeWithRetry'](operation, 3, 10, 1);

      // Assert
      expect(result).toBe('success');
      expect(attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      // Arrange
      const operation = jest.fn().mockRejectedValue(new Error('File not found'));

      // Act & Assert
      await expect(adapter['executeWithRetry'](operation, 3, 10, 1)).rejects.toThrow(
        'File not found',
      );
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff', async () => {
      // Arrange
      let attempts = 0;
      const startTimes: number[] = [];

      const operation = jest.fn().mockImplementation(async () => {
        attempts++;
        startTimes.push(Date.now());
        if (attempts < 3) {
          throw new Error('Connection timeout');
        }
        return 'success';
      });

      // Act
      await adapter['executeWithRetry'](operation, 3, 50, 2);

      // Assert
      expect(attempts).toBe(3);
      if (startTimes.length >= 3) {
        const delay1 = startTimes[1] - startTimes[0];
        const delay2 = startTimes[2] - startTimes[1];
        expect(delay1).toBeGreaterThanOrEqual(50);
        expect(delay2).toBeGreaterThanOrEqual(100); // 50 * 2
      }
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      // Arrange & Act & Assert
      expect(adapter['isRetryableError'](new Error('Connection timeout'))).toBe(true);
      expect(adapter['isRetryableError'](new Error('Network error'))).toBe(true);
      expect(adapter['isRetryableError'](new Error('ECONNRESET'))).toBe(true);
      expect(adapter['isRetryableError'](new Error('503 Service Unavailable'))).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      // Arrange & Act & Assert
      expect(adapter['isRetryableError'](new Error('File not found'))).toBe(false);
      expect(adapter['isRetryableError'](new Error('Permission denied'))).toBe(false);
      expect(adapter['isRetryableError'](new Error('Invalid path'))).toBe(false);
    });
  });
});
