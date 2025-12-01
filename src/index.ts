/**
 * Super FTP Library
 * Biblioteca reutilizável para gerenciamento de FTP, SFTP e FTPS
 */

// Classe principal - uso recomendado
export { SuperFtp } from './super-ftp';
export type { SuperFtpConnectionInput } from './super-ftp';

// Interfaces (para casos avançados)
export * from './interfaces';

// Constants
export * from './constants';

// Utils
export * from './utils';

// Adapters (para casos avançados - uso direto não recomendado)
export * from './adapters';

// Factories (para casos avançados - uso direto não recomendado)
export * from './factories';

// Services removidos - funcionalidade integrada em SuperFtp
