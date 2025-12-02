/**
 * Teste de Integração Real - SFTP
 *
 * Este teste conecta a um servidor SFTP real e testa todas as funcionalidades
 * da biblioteca SuperFtp. É um smoke test/integration test completo.
 *
 * IMPORTANTE: Este teste requer um servidor SFTP válido e ativo.
 * Configure as variáveis de ambiente: SFTP_HOST, SFTP_PORT, SFTP_USER, SFTP_PASSWORD
 *
 * Para executar este teste:
 * npm run test -- test/integration/sftp-integration.spec.ts
 */

import { SuperFtp } from '../../src/super-ftp';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const rmdir = promisify(fs.rmdir);
const exists = promisify(fs.exists);

// Configuração do servidor SFTP
// IMPORTANTE: Configure as variáveis de ambiente para usar um servidor real
// SFTP_HOST, SFTP_PORT, SFTP_USER, SFTP_PASSWORD
const SFTP_CONFIG = {
  host: process.env.SFTP_HOST || '',
  port: parseInt(process.env.SFTP_PORT || '22', 10),
  user: process.env.SFTP_USER || '',
  password: process.env.SFTP_PASSWORD || '',
};

// Diretório temporário para arquivos de teste locais
const TEST_DIR = path.join(__dirname, '../../.test-temp');
// Diretório remoto de teste (relativo ao home do usuário)
const REMOTE_TEST_DIR = process.env.SFTP_TEST_DIR || 'test-super-ftp';

describe('SFTP Integration Tests', () => {
  let ftp: SuperFtp;
  let localTestFile: string;
  let localTestFile2: string;
  let localTestDir: string;

  beforeAll(async () => {
    // Arrange: Criar diretório temporário local
    if (!(await exists(TEST_DIR))) {
      await mkdir(TEST_DIR, { recursive: true });
    }

    // Arrange: Criar arquivos de teste locais
    localTestFile = path.join(TEST_DIR, 'test-file.txt');
    localTestFile2 = path.join(TEST_DIR, 'test-file-2.txt');
    localTestDir = path.join(TEST_DIR, 'subdir');

    await writeFile(localTestFile, 'Conteúdo do arquivo de teste 1\nLinha 2\nLinha 3');
    await writeFile(localTestFile2, 'Conteúdo do arquivo de teste 2');
    await mkdir(localTestDir, { recursive: true });
    await writeFile(path.join(localTestDir, 'nested-file.txt'), 'Arquivo aninhado');

    // Arrange: Criar instância do SuperFtp
    ftp = new SuperFtp(
      {
        protocol: 'sftp',
        ...SFTP_CONFIG,
        connectionTimeout: 10000,
        commandTimeout: 5000,
      },
      {
        hostVerifier: () => true, // Aceita automaticamente a chave do host para testes
      },
    );

    // Arrange: Conectar e criar diretório remoto de teste
    await ftp.connect();

    // Criar o diretório remoto de teste (isolado para esta execução)
    const dirExists = await ftp.exists(REMOTE_TEST_DIR);
    if (!dirExists) {
      await ftp.mkdir(REMOTE_TEST_DIR);
    }
  });

  afterAll(async () => {
    // Limpar diretório remoto de teste completamente (com todo seu conteúdo)
    try {
      if (ftp && ftp.isConnected() && REMOTE_TEST_DIR) {
        const dirExists = await ftp.exists(REMOTE_TEST_DIR);
        if (dirExists) {
          // Remover recursivamente todo o conteúdo do diretório de teste
          await ftp.rmdir(REMOTE_TEST_DIR, true);

          // Verificar que foi removido completamente
          const stillExists = await ftp.exists(REMOTE_TEST_DIR);
          if (stillExists) {
            console.warn(
              `⚠️ Aviso: O diretório de teste ${REMOTE_TEST_DIR} ainda existe após limpeza`,
            );
          }
        }
      }
    } catch (error: any) {
      console.warn(`⚠️ Erro ao limpar diretório remoto de teste: ${error.message}`);
    }

    // Desconectar do servidor
    try {
      if (ftp && ftp.isConnected()) {
        await ftp.disconnect();
      }
    } catch {
      // Ignorar erros de desconexão
    }

    // Limpar arquivos locais
    try {
      if (await exists(localTestFile)) {
        await unlink(localTestFile);
      }
      if (await exists(localTestFile2)) {
        await unlink(localTestFile2);
      }
      if (await exists(path.join(localTestDir, 'nested-file.txt'))) {
        await unlink(path.join(localTestDir, 'nested-file.txt'));
      }
      if (await exists(localTestDir)) {
        await rmdir(localTestDir);
      }
      if (await exists(TEST_DIR)) {
        await rmdir(TEST_DIR);
      }
    } catch {
      // Ignorar erros de limpeza
    }
  });

  describe('Conexão e Desconexão', () => {
    it('deve conectar ao servidor SFTP quando não está conectado', async () => {
      // Arrange
      if (ftp.isConnected()) {
        await ftp.disconnect();
      }
      expect(ftp.isConnected()).toBe(false);

      // Act
      await ftp.connect();

      // Assert
      expect(ftp.isConnected()).toBe(true);
    });

    it('deve retornar o diretório atual (pwd) após conexão', async () => {
      // Arrange
      if (!ftp.isConnected()) {
        await ftp.connect();
      }

      // Act
      const currentDir = await ftp.pwd();

      // Assert
      expect(currentDir).toBeTruthy();
      expect(typeof currentDir).toBe('string');
      expect(currentDir.length).toBeGreaterThan(0);
      expect(currentDir).toMatch(/^\/.*/); // Deve ser um caminho absoluto
    });

    it('deve indicar que está conectado após conexão bem-sucedida', () => {
      // Arrange
      if (!ftp.isConnected()) {
        throw new Error('Teste requer conexão ativa');
      }

      // Act
      const isConnected = ftp.isConnected();

      // Assert
      expect(isConnected).toBe(true);
    });

    it('deve desconectar do servidor quando está conectado', async () => {
      // Arrange
      if (!ftp.isConnected()) {
        await ftp.connect();
      }
      expect(ftp.isConnected()).toBe(true);

      // Act
      await ftp.disconnect();

      // Assert
      expect(ftp.isConnected()).toBe(false);
    });
  });

  describe('Operações de Diretório', () => {
    beforeEach(async () => {
      // Garantir conexão antes de cada teste
      if (!ftp.isConnected()) {
        await ftp.connect();
      }
    });

    it('deve criar um diretório simples quando o caminho não existe', async () => {
      // Arrange
      const dirPath = `${REMOTE_TEST_DIR}/test-simple-dir-${Date.now()}`;
      const existsBefore = await ftp.exists(dirPath);
      expect(existsBefore).toBe(false);

      // Act
      await ftp.mkdir(dirPath);

      // Assert
      const existsAfter = await ftp.exists(dirPath);
      expect(existsAfter).toBe(true);

      // Cleanup
      await ftp.rmdir(dirPath);
    });

    it('deve criar diretórios recursivamente quando o caminho não existe', async () => {
      // Arrange
      const timestamp = Date.now();
      const baseDir = `${REMOTE_TEST_DIR}/test-nested-${timestamp}`;
      const dirPath = `${baseDir}/deep/structure`;
      const existsBefore = await ftp.exists(dirPath);
      expect(existsBefore).toBe(false);

      // Act
      await ftp.mkdir(dirPath, true);

      // Assert
      const existsAfter = await ftp.exists(dirPath);
      expect(existsAfter).toBe(true);
      // Verificar que os diretórios intermediários também foram criados
      const parentExists = await ftp.exists(baseDir);
      expect(parentExists).toBe(true);
      const deepExists = await ftp.exists(`${baseDir}/deep`);
      expect(deepExists).toBe(true);

      // Cleanup
      await ftp.rmdir(baseDir, true);
    });

    it('deve listar arquivos e diretórios de um diretório existente', async () => {
      // Arrange
      const testDir = `${REMOTE_TEST_DIR}/test-list-${Date.now()}`;
      await ftp.mkdir(testDir);
      const testFileName = 'test-file.txt';
      const testFileContent = 'test content';
      await ftp.uploadBuffer(Buffer.from(testFileContent), `${testDir}/${testFileName}`);

      // Act
      const files = await ftp.list(testDir);

      // Assert
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
      const testFile = files.find((f) => f.name === testFileName);
      expect(testFile).toBeDefined();
      expect(testFile?.type).toBe('file');
      expect(testFile?.size).toBe(testFileContent.length);

      // Cleanup
      await ftp.delete(`${testDir}/${testFileName}`);
      await ftp.rmdir(testDir);
    });

    it('deve validar que um diretório existe ao chamar cwd', async () => {
      // Arrange
      const testDir = `${REMOTE_TEST_DIR}/test-cwd-${Date.now()}`;
      await ftp.mkdir(testDir);
      const existsBefore = await ftp.exists(testDir);
      expect(existsBefore).toBe(true);

      // Act
      await ftp.cwd(testDir);

      // Assert
      // cwd não deve lançar erro se o diretório existe
      const existsAfter = await ftp.exists(testDir);
      expect(existsAfter).toBe(true);

      // Cleanup
      await ftp.rmdir(testDir);
    });

    it('deve lançar erro ao tentar cwd em diretório inexistente', async () => {
      // Arrange
      const nonExistentDir = `${REMOTE_TEST_DIR}/non-existent-${Date.now()}`;
      const existsBefore = await ftp.exists(nonExistentDir);
      expect(existsBefore).toBe(false);

      // Act & Assert
      await expect(ftp.cwd(nonExistentDir)).rejects.toThrow('Directory does not exist');
    });

    it('deve retornar o mesmo diretório ao chamar cwd com o diretório atual', async () => {
      // Arrange
      const homeDir = await ftp.pwd();
      expect(homeDir).toBeTruthy();

      // Act
      await ftp.cwd(homeDir);
      const currentDir = await ftp.pwd();

      // Assert
      expect(currentDir).toBe(homeDir);
    });
  });

  describe('Upload de Arquivos', () => {
    beforeEach(async () => {
      if (!ftp.isConnected()) {
        await ftp.connect();
      }
    });

    it('deve fazer upload de um arquivo do sistema de arquivos para o servidor', async () => {
      // Arrange
      const remotePath = `${REMOTE_TEST_DIR}/test-upload-${Date.now()}.txt`;
      const localContent = await readFile(localTestFile, 'utf-8');
      const existsBefore = await ftp.exists(remotePath);
      expect(existsBefore).toBe(false);

      // Act
      await ftp.upload(localTestFile, remotePath);

      // Assert
      const existsAfter = await ftp.exists(remotePath);
      expect(existsAfter).toBe(true);

      const fileInfo = await ftp.getFileInfo(remotePath);
      expect(fileInfo).not.toBeNull();
      expect(fileInfo?.type).toBe('file');
      expect(fileInfo?.size).toBeGreaterThan(0);
      expect(fileInfo?.name).toBe(path.basename(remotePath));

      // Verificar conteúdo
      const downloadedContent = await ftp.downloadBuffer(remotePath);
      expect(downloadedContent.toString('utf-8')).toBe(localContent);

      // Cleanup
      await ftp.delete(remotePath);
    });

    it('deve criar diretório automaticamente ao fazer upload com createDir: true', async () => {
      // Arrange
      const remoteDir = `${REMOTE_TEST_DIR}/auto-dir-${Date.now()}`;
      const remotePath = `${remoteDir}/auto-uploaded.txt`;
      const dirExistsBefore = await ftp.exists(remoteDir);
      expect(dirExistsBefore).toBe(false);

      // Act
      await ftp.upload(localTestFile2, remotePath, { createDir: true });

      // Assert
      const fileExists = await ftp.exists(remotePath);
      expect(fileExists).toBe(true);
      const dirExistsAfter = await ftp.exists(remoteDir);
      expect(dirExistsAfter).toBe(true);

      // Cleanup
      await ftp.delete(remotePath);
      await ftp.rmdir(remoteDir);
    });

    it('deve fazer upload de um buffer e preservar o conteúdo exato', async () => {
      // Arrange
      const bufferContent = Buffer.from('Conteúdo do buffer de teste\nLinha 2');
      const remotePath = `${REMOTE_TEST_DIR}/test-buffer-${Date.now()}.txt`;
      const existsBefore = await ftp.exists(remotePath);
      expect(existsBefore).toBe(false);

      // Act
      await ftp.uploadBuffer(bufferContent, remotePath);

      // Assert
      const existsAfter = await ftp.exists(remotePath);
      expect(existsAfter).toBe(true);

      const fileInfo = await ftp.getFileInfo(remotePath);
      expect(fileInfo?.size).toBe(bufferContent.length);

      const downloadedBuffer = await ftp.downloadBuffer(remotePath);
      expect(downloadedBuffer.toString('utf-8')).toBe(bufferContent.toString('utf-8'));
      expect(Buffer.compare(downloadedBuffer, bufferContent)).toBe(0);

      // Cleanup
      await ftp.delete(remotePath);
    });

    it('deve fazer upload de múltiplos arquivos sequencialmente', async () => {
      // Arrange
      const timestamp = Date.now();
      const files = [
        { local: localTestFile, remote: `${REMOTE_TEST_DIR}/multi-1-${timestamp}.txt` },
        { local: localTestFile2, remote: `${REMOTE_TEST_DIR}/multi-2-${timestamp}.txt` },
      ];

      // Act
      for (const file of files) {
        await ftp.upload(file.local, file.remote);
      }

      // Assert
      for (const file of files) {
        const pathExists = await ftp.exists(file.remote);
        expect(pathExists).toBe(true);
        const fileInfo = await ftp.getFileInfo(file.remote);
        expect(fileInfo).not.toBeNull();
        expect(fileInfo?.type).toBe('file');
      }

      // Cleanup
      for (const file of files) {
        await ftp.delete(file.remote);
      }
    });
  });

  describe('Download de Arquivos', () => {
    beforeEach(async () => {
      if (!ftp.isConnected()) {
        await ftp.connect();
      }
    });

    it('deve fazer download de um arquivo para o sistema de arquivos e preservar conteúdo', async () => {
      // Arrange
      const remotePath = `${REMOTE_TEST_DIR}/test-download-${Date.now()}.txt`;
      const localDownloadPath = path.join(TEST_DIR, `downloaded-${Date.now()}.txt`);
      const originalContent = 'Conteúdo original para download';
      await ftp.uploadBuffer(Buffer.from(originalContent), remotePath);
      const remoteExists = await ftp.exists(remotePath);
      expect(remoteExists).toBe(true);

      // Act
      await ftp.download(remotePath, localDownloadPath);

      // Assert
      const fileExists = await exists(localDownloadPath);
      expect(fileExists).toBe(true);

      const downloadedContent = await readFile(localDownloadPath, 'utf-8');
      expect(downloadedContent).toBe(originalContent);

      // Cleanup
      await unlink(localDownloadPath);
      await ftp.delete(remotePath);
    });

    it('deve fazer download de um arquivo para um buffer e preservar conteúdo', async () => {
      // Arrange
      const remotePath = `${REMOTE_TEST_DIR}/test-buffer-download-${Date.now()}.txt`;
      const originalContent = 'Conteúdo do buffer de teste';
      await ftp.uploadBuffer(Buffer.from(originalContent), remotePath);
      const remoteExists = await ftp.exists(remotePath);
      expect(remoteExists).toBe(true);

      // Act
      const buffer = await ftp.downloadBuffer(remotePath);

      // Assert
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.toString('utf-8')).toBe(originalContent);

      // Cleanup
      await ftp.delete(remotePath);
    });

    it('deve fazer download de múltiplos arquivos sequencialmente', async () => {
      // Arrange
      const timestamp = Date.now();
      const testFiles = [
        { remote: `${REMOTE_TEST_DIR}/download-multi-1-${timestamp}.txt`, content: 'Conteúdo 1' },
        { remote: `${REMOTE_TEST_DIR}/download-multi-2-${timestamp}.txt`, content: 'Conteúdo 2' },
      ];

      for (const file of testFiles) {
        await ftp.uploadBuffer(Buffer.from(file.content), file.remote);
        const exists = await ftp.exists(file.remote);
        expect(exists).toBe(true);
      }

      // Act
      const downloads: Array<{ local: string; content: string }> = [];
      for (const file of testFiles) {
        const localPath = path.join(TEST_DIR, `downloaded-${path.basename(file.remote)}`);
        await ftp.download(file.remote, localPath);
        downloads.push({ local: localPath, content: file.content });
      }

      // Assert
      for (const download of downloads) {
        const fileExists = await exists(download.local);
        expect(fileExists).toBe(true);
        const content = await readFile(download.local, 'utf-8');
        expect(content).toBe(download.content);
      }

      // Cleanup
      for (const download of downloads) {
        await unlink(download.local);
      }
      for (const file of testFiles) {
        await ftp.delete(file.remote);
      }
    });
  });

  describe('Verificação de Existência', () => {
    beforeEach(async () => {
      if (!ftp.isConnected()) {
        await ftp.connect();
      }
    });

    it('deve retornar true para um arquivo que existe', async () => {
      // Arrange
      const remotePath = `${REMOTE_TEST_DIR}/test-exists-${Date.now()}.txt`;
      await ftp.uploadBuffer(Buffer.from('test'), remotePath);
      const existsBefore = await ftp.exists(remotePath);
      expect(existsBefore).toBe(true);

      // Act
      const pathExists = await ftp.exists(remotePath);

      // Assert
      expect(pathExists).toBe(true);

      // Cleanup
      await ftp.delete(remotePath);
    });

    it('deve retornar true para um diretório que existe', async () => {
      // Arrange
      const dirPath = `${REMOTE_TEST_DIR}/test-exists-dir-${Date.now()}`;
      await ftp.mkdir(dirPath);
      const existsBefore = await ftp.exists(dirPath);
      expect(existsBefore).toBe(true);

      // Act
      const pathExists = await ftp.exists(dirPath);

      // Assert
      expect(pathExists).toBe(true);

      // Cleanup
      await ftp.rmdir(dirPath);
    });

    it('deve retornar false para um arquivo que não existe', async () => {
      // Arrange
      const remotePath = `${REMOTE_TEST_DIR}/nonexistent-${Date.now()}.txt`;
      const existsBefore = await ftp.exists(remotePath);
      expect(existsBefore).toBe(false);

      // Act
      const pathExists = await ftp.exists(remotePath);

      // Assert
      expect(pathExists).toBe(false);
    });
  });

  describe('Obter Informações de Arquivo', () => {
    beforeEach(async () => {
      if (!ftp.isConnected()) {
        await ftp.connect();
      }
    });

    it('deve retornar informações completas de um arquivo existente', async () => {
      // Arrange
      const remotePath = `${REMOTE_TEST_DIR}/test-info-${Date.now()}.txt`;
      const fileContent = 'Conteúdo do arquivo de teste';
      const fileBuffer = Buffer.from(fileContent);
      await ftp.uploadBuffer(fileBuffer, remotePath);
      const exists = await ftp.exists(remotePath);
      expect(exists).toBe(true);

      // Act
      const fileInfo = await ftp.getFileInfo(remotePath);

      // Assert
      expect(fileInfo).not.toBeNull();
      expect(fileInfo?.name).toBe(path.basename(remotePath));
      expect(fileInfo?.type).toBe('file');
      expect(fileInfo?.size).toBe(fileBuffer.length);
      expect(fileInfo?.path).toContain(path.basename(remotePath));

      // Cleanup
      await ftp.delete(remotePath);
    });

    it('deve retornar null para um arquivo inexistente', async () => {
      // Arrange
      const remotePath = `${REMOTE_TEST_DIR}/nonexistent-info-${Date.now()}.txt`;
      const existsBefore = await ftp.exists(remotePath);
      expect(existsBefore).toBe(false);

      // Act
      const fileInfo = await ftp.getFileInfo(remotePath);

      // Assert
      expect(fileInfo).toBeNull();
    });
  });

  describe('Renomeação e Movimentação', () => {
    beforeEach(async () => {
      if (!ftp.isConnected()) {
        await ftp.connect();
      }
    });

    it('deve renomear um arquivo existente', async () => {
      // Arrange
      const timestamp = Date.now();
      const oldPath = `${REMOTE_TEST_DIR}/old-name-${timestamp}.txt`;
      const newPath = `${REMOTE_TEST_DIR}/new-name-${timestamp}.txt`;
      const fileContent = 'test content';
      await ftp.uploadBuffer(Buffer.from(fileContent), oldPath);
      const existsBefore = await ftp.exists(oldPath);
      expect(existsBefore).toBe(true);
      const existsNewBefore = await ftp.exists(newPath);
      expect(existsNewBefore).toBe(false);

      // Act
      await ftp.rename(oldPath, newPath);

      // Assert
      const existsOld = await ftp.exists(oldPath);
      expect(existsOld).toBe(false);
      const existsNew = await ftp.exists(newPath);
      expect(existsNew).toBe(true);
      // Verificar que o conteúdo foi preservado
      const downloadedContent = await ftp.downloadBuffer(newPath);
      expect(downloadedContent.toString('utf-8')).toBe(fileContent);

      // Cleanup
      await ftp.delete(newPath);
    });

    it('deve mover um arquivo para outro diretório', async () => {
      // Arrange
      const timestamp = Date.now();
      const sourcePath = `${REMOTE_TEST_DIR}/source-${timestamp}.txt`;
      const targetDir = `${REMOTE_TEST_DIR}/move-dir-${timestamp}`;
      const targetPath = `${targetDir}/moved-file.txt`;
      const fileContent = 'test content';
      await ftp.uploadBuffer(Buffer.from(fileContent), sourcePath);
      await ftp.mkdir(targetDir);
      const existsSourceBefore = await ftp.exists(sourcePath);
      expect(existsSourceBefore).toBe(true);
      const existsTargetBefore = await ftp.exists(targetPath);
      expect(existsTargetBefore).toBe(false);

      // Act
      await ftp.rename(sourcePath, targetPath);

      // Assert
      const existsSource = await ftp.exists(sourcePath);
      expect(existsSource).toBe(false);
      const existsTarget = await ftp.exists(targetPath);
      expect(existsTarget).toBe(true);
      // Verificar que o conteúdo foi preservado
      const downloadedContent = await ftp.downloadBuffer(targetPath);
      expect(downloadedContent.toString('utf-8')).toBe(fileContent);

      // Cleanup
      await ftp.delete(targetPath);
      await ftp.rmdir(targetDir);
    });
  });

  describe('Remoção de Arquivos e Diretórios', () => {
    beforeEach(async () => {
      if (!ftp.isConnected()) {
        await ftp.connect();
      }
    });

    it('deve remover um arquivo existente', async () => {
      // Arrange
      const remotePath = `${REMOTE_TEST_DIR}/test-delete-${Date.now()}.txt`;
      await ftp.uploadBuffer(Buffer.from('test'), remotePath);
      const existsBefore = await ftp.exists(remotePath);
      expect(existsBefore).toBe(true);

      // Act
      await ftp.delete(remotePath);

      // Assert
      const existsAfter = await ftp.exists(remotePath);
      expect(existsAfter).toBe(false);
    });

    it('deve remover múltiplos arquivos sequencialmente', async () => {
      // Arrange
      const timestamp = Date.now();
      const filesToDelete = [
        `${REMOTE_TEST_DIR}/delete-multi-1-${timestamp}.txt`,
        `${REMOTE_TEST_DIR}/delete-multi-2-${timestamp}.txt`,
        `${REMOTE_TEST_DIR}/delete-multi-3-${timestamp}.txt`,
      ];

      for (const file of filesToDelete) {
        await ftp.uploadBuffer(Buffer.from('test'), file);
        const exists = await ftp.exists(file);
        expect(exists).toBe(true);
      }

      // Act
      for (const file of filesToDelete) {
        await ftp.delete(file);
      }

      // Assert
      for (const file of filesToDelete) {
        const pathExists = await ftp.exists(file);
        expect(pathExists).toBe(false);
      }
    });

    it('deve remover um diretório vazio', async () => {
      // Arrange
      const emptyDir = `${REMOTE_TEST_DIR}/test-empty-dir-${Date.now()}`;
      await ftp.mkdir(emptyDir);
      const existsBefore = await ftp.exists(emptyDir);
      expect(existsBefore).toBe(true);

      // Act
      await ftp.rmdir(emptyDir);

      // Assert
      const existsAfter = await ftp.exists(emptyDir);
      expect(existsAfter).toBe(false);
    });

    it('deve remover diretórios recursivamente com conteúdo', async () => {
      // Arrange
      const timestamp = Date.now();
      const dirPath = `${REMOTE_TEST_DIR}/test-recursive-${timestamp}`;
      const nestedDir = `${dirPath}/nested/deep`;
      const filePath = `${nestedDir}/file.txt`;
      await ftp.mkdir(nestedDir, true);
      await ftp.uploadBuffer(Buffer.from('test'), filePath);
      const existsBefore = await ftp.exists(dirPath);
      expect(existsBefore).toBe(true);
      const fileExistsBefore = await ftp.exists(filePath);
      expect(fileExistsBefore).toBe(true);

      // Act
      await ftp.rmdir(dirPath, true);

      // Assert
      const existsAfter = await ftp.exists(dirPath);
      expect(existsAfter).toBe(false);
      const fileExistsAfter = await ftp.exists(filePath);
      expect(fileExistsAfter).toBe(false);
    });
  });

  describe('Listagem Avançada', () => {
    beforeEach(async () => {
      if (!ftp.isConnected()) {
        await ftp.connect();
      }
    });

    it('deve listar arquivos específicos criados em um diretório', async () => {
      // Arrange
      const testDir = `${REMOTE_TEST_DIR}/test-list-specific-${Date.now()}`;
      await ftp.mkdir(testDir);
      const testFiles = [
        `${testDir}/list-test-1.txt`,
        `${testDir}/list-test-2.txt`,
        `${testDir}/list-test-3.txt`,
      ];

      for (const file of testFiles) {
        await ftp.uploadBuffer(Buffer.from('test'), file);
        const exists = await ftp.exists(file);
        expect(exists).toBe(true);
      }

      // Act
      const files = await ftp.list(testDir);

      // Assert
      const testFileNames = files
        .filter((f) => f.name.startsWith('list-test-'))
        .map((f) => f.name)
        .sort();

      expect(testFileNames.length).toBe(3);
      expect(testFileNames).toContain('list-test-1.txt');
      expect(testFileNames).toContain('list-test-2.txt');
      expect(testFileNames).toContain('list-test-3.txt');

      // Cleanup
      for (const file of testFiles) {
        await ftp.delete(file);
      }
      await ftp.rmdir(testDir);
    });

    it('deve listar arquivos no diretório atual quando path não é fornecido', async () => {
      // Arrange
      const currentDir = await ftp.pwd();
      expect(currentDir).toBeTruthy();

      // Act
      const files = await ftp.list();

      // Assert
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThanOrEqual(0);
      // Todos os arquivos devem ter propriedades válidas
      for (const file of files) {
        expect(file.name).toBeTruthy();
        expect(file.type).toMatch(/^(file|directory)$/);
        expect(file.path).toBeTruthy();
      }
    });
  });

  describe('Testes de Robustez', () => {
    beforeEach(async () => {
      if (!ftp.isConnected()) {
        await ftp.connect();
      }
    });

    it('deve reconectar automaticamente após desconexão ao executar operação', async () => {
      // Arrange
      expect(ftp.isConnected()).toBe(true);
      await ftp.disconnect();
      expect(ftp.isConnected()).toBe(false);

      // Act
      const currentDir = await ftp.pwd();

      // Assert
      expect(ftp.isConnected()).toBe(true);
      expect(currentDir).toBeTruthy();
      expect(typeof currentDir).toBe('string');
    });

    it('deve lidar com operações em lote (upload paralelo)', async () => {
      // Arrange
      const timestamp = Date.now();
      const testDir = `${REMOTE_TEST_DIR}/test-batch-${timestamp}`;
      await ftp.mkdir(testDir);
      const operations: Promise<void>[] = [];
      const expectedFiles: string[] = [];

      for (let i = 0; i < 5; i++) {
        const remotePath = `${testDir}/batch-test-${i}.txt`;
        expectedFiles.push(`batch-test-${i}.txt`);
        operations.push(ftp.uploadBuffer(Buffer.from(`Batch test ${i}`), remotePath));
      }

      // Act
      await Promise.all(operations);

      // Assert
      const files = await ftp.list(testDir);
      const batchFiles = files
        .filter((f) => f.name.startsWith('batch-test-'))
        .map((f) => f.name)
        .sort();

      expect(batchFiles.length).toBe(5);
      for (let i = 0; i < 5; i++) {
        expect(batchFiles).toContain(`batch-test-${i}.txt`);
        // Verificar que o conteúdo está correto
        const filePath = `${testDir}/batch-test-${i}.txt`;
        const content = await ftp.downloadBuffer(filePath);
        expect(content.toString('utf-8')).toBe(`Batch test ${i}`);
      }

      // Cleanup
      for (let i = 0; i < 5; i++) {
        await ftp.delete(`${testDir}/batch-test-${i}.txt`);
      }
      await ftp.rmdir(testDir);
    });
  });
});
