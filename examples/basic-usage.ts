/**
 * Exemplos de uso básico do SuperFtp
 */

import { SuperFtp } from '../src/super-ftp';

async function exemploBasico() {
  // Exemplo 1: FTP simples com string de conexão
  const ftp = new SuperFtp('ftp://username:password@ftp.example.com:21');

  // Listar arquivos
  const files = await ftp.list('/remote/path');
  console.log('Arquivos:', files);

  // Upload
  await ftp.upload('/local/file.txt', '/remote/file.txt');

  // Download
  await ftp.download('/remote/file.txt', '/local/downloaded.txt');

  // Criar diretório
  await ftp.mkdir('/remote/new/directory', true);

  // Verificar se existe
  const exists = await ftp.exists('/remote/file.txt');
  console.log('Arquivo existe:', exists);

  // Desconectar
  await ftp.disconnect();
}

async function exemploComOpcoesAvancadas() {
  // Exemplo 2: SFTP com opções avançadas
  const sftp = new SuperFtp('sftp://user:pass@sftp.example.com:22', {
    connectionTimeout: 10000,
    commandTimeout: 5000,
    // Para SFTP, você pode passar chave privada
    // privateKey: fs.readFileSync('/path/to/key'),
    // passphrase: 'passphrase',
  });

  await sftp.upload('/local/file.txt', '/remote/file.txt');
  await sftp.disconnect();
}

async function exemploComConfigObject() {
  // Exemplo 3: Usando objeto de configuração
  const ftps = new SuperFtp(
    {
      protocol: 'ftps',
      host: 'ftps.example.com',
      port: 21,
      user: 'username',
      password: 'password',
    },
    {
      secureOptions: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
    },
  );

  await ftps.connect();
  const currentDir = await ftps.pwd();
  console.log('Diretório atual:', currentDir);
  await ftps.disconnect();
}

async function exemploUploadBuffer() {
  // Exemplo 4: Upload de buffer
  const ftp = new SuperFtp('ftp://user:pass@host.com:21');

  const buffer = Buffer.from('Conteúdo do arquivo');
  await ftp.uploadBuffer(buffer, '/remote/file.txt', {
    createDir: true, // Cria diretórios automaticamente
  });

  // Download para buffer
  const downloadedBuffer = await ftp.downloadBuffer('/remote/file.txt');
  console.log('Conteúdo:', downloadedBuffer.toString());

  await ftp.disconnect();
}

async function exemploProgressCallbacks() {
  // Exemplo 5: Transferências com callbacks de progresso
  const ftp = new SuperFtp('ftp://user:pass@host.com:21');

  console.log('Fazendo upload com progresso...');
  await ftp.upload('/local/large-file.zip', '/remote/large-file.zip', {
    onProgress: (transferred, total) => {
      const percent = Math.round((transferred / total) * 100);
      console.log(`Upload: ${percent}% concluído (${transferred}/${total} bytes)`);
    }
  });

  console.log('Fazendo download com progresso...');
  await ftp.download('/remote/large-file.zip', '/local/downloaded-file.zip', {
    onProgress: (transferred, total) => {
      const percent = Math.round((transferred / total) * 100);
      console.log(`Download: ${percent}% concluído (${transferred}/${total} bytes)`);
    }
  });

  await ftp.disconnect();
}

async function exemploTransferenciaDiretorios() {
  // Exemplo 6: Transferência recursiva de diretórios
  const ftp = new SuperFtp('ftp://user:pass@host.com:21');

  console.log('Fazendo upload de diretório...');
  await ftp.uploadDir('/local/website', '/remote/website', {
    createDir: true, // Cria diretórios automaticamente
    onProgress: (transferred, total) => {
      const percent = Math.round((transferred / total) * 100);
      console.log(`Upload dir: ${percent}% concluído`);
    }
  });

  console.log('Fazendo download de diretório...');
  await ftp.downloadDir('/remote/website', '/local/downloaded-website', {
    onProgress: (transferred, total) => {
      const percent = Math.round((transferred / total) * 100);
      console.log(`Download dir: ${percent}% concluído`);
    }
  });

  await ftp.disconnect();
}

async function exemploLazyConnectionsAvancadas() {
  // Exemplo 7: Lazy connections com auto-reconnect e health checks
  const ftp = new SuperFtp('ftp://user:pass@host.com:21', {
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelay: 2000,
  });

  // Health check
  const isHealthy = await ftp.healthCheck();
  console.log('Conexão saudável:', isHealthy);

  // Estatísticas da conexão
  const stats = ftp.getConnectionStats();
  console.log('Estatísticas da conexão:', stats);

  // Operações - serão automaticamente reconectadas se necessário
  await ftp.upload('/local/file.txt', '/remote/file.txt');

  // Forçar reconexão manual se necessário
  await ftp.forceReconnect();

  await ftp.disconnect();
}

// Executar exemplos (descomente para testar)
// exemploBasico();
// exemploComOpcoesAvancadas();
// exemploComConfigObject();
// exemploUploadBuffer();
// exemploProgressCallbacks();
// exemploTransferenciaDiretorios();
// exemploLazyConnectionsAvancadas();

