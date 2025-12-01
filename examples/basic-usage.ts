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

// Executar exemplos (descomente para testar)
// exemploBasico();
// exemploComOpcoesAvancadas();
// exemploComConfigObject();
// exemploUploadBuffer();

