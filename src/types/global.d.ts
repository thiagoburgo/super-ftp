/// <reference types="node" />

// Global Buffer type declaration for Node.js
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Buffer } from 'node:buffer';

declare global {
  // Make Buffer available as a type
  type Buffer = import('node:buffer').Buffer;
}

export {};
