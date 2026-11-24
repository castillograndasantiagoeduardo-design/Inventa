// Tipos mínimos de pngjs (el paquete no trae declaraciones propias).
import type { Buffer } from 'node:buffer';

export declare const PNG: {
  sync: {
    read(buffer: Buffer): { width: number; height: number; data: Uint8Array };
  };
};
