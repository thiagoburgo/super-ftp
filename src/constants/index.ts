/**
 * Constantes da biblioteca
 */

/**
 * Portas padrão dos protocolos
 */
export const DEFAULT_PORTS = {
  FTP: 21,
  FTPS: 21,
  SFTP: 22,
} as const;

/**
 * Timeouts padrão (em milissegundos)
 */
export const DEFAULT_TIMEOUTS = {
  CONNECTION: 30000, // 30 segundos
  COMMAND: 10000, // 10 segundos
} as const;

/**
 * Tipos de protocolo suportados
 */
export enum ProtocolType {
  FTP = 'ftp',
  FTPS = 'ftps',
  SFTP = 'sftp',
}

/**
 * Modos de transferência
 */
export enum TransferMode {
  BINARY = 'binary',
  ASCII = 'ascii',
}
