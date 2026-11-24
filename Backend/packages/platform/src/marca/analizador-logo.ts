/**
 * analizador-logo.ts — Valida el logo de una empresa (solo PNG) y detecta su color principal.
 *
 * Reglas:
 *  - Firma PNG real (no basta la extensión), ≤ 1 MB, ≤ 2048 px por lado, decodificable.
 *  - Color principal: el color dominante ignorando transparencias, blancos, negros y grises
 *    claros (fondos), con preferencia por los colores saturados. Si el logo es gris, se usa ese gris.
 *  - La luminosidad se ajusta a un rango usable como color de acento en modo claro y oscuro.
 */

// @deno-types="./pngjs.d.ts"
import { PNG } from 'pngjs';
import { Buffer } from 'node:buffer';
import type { IAnalizadorLogo, ResultadoAnalisisLogo } from '@inventa/core';

export const LOGO_MAX_BYTES = 1024 * 1024;
export const LOGO_MAX_LADO = 2048;
const FIRMA_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const aHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;

function rgbAHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslARgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const canal = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [canal(h + 1 / 3) * 255, canal(h) * 255, canal(h - 1 / 3) * 255];
}

/** Color principal a partir de píxeles RGBA (función pura, testeable). */
export function colorPrincipalDesdeRgba(rgba: Uint8Array, ancho: number, alto: number): string {
  const paso = Math.max(1, Math.floor(Math.sqrt((ancho * alto) / 40000)));
  const cubetas = new Map<number, { peso: number; r: number; g: number; b: number }>();
  let grises = { n: 0, r: 0, g: 0, b: 0 };

  for (let y = 0; y < alto; y += paso) {
    for (let x = 0; x < ancho; x += paso) {
      const i = (y * ancho + x) * 4;
      const [r, g, b, a] = [rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]];
      if (a < 128) continue; // fondo transparente
      const [, s, l] = rgbAHsl(r, g, b);
      if (l > 0.93 || l < 0.06) continue; // fondos blancos o negros
      if (s < 0.15) {
        grises = { n: grises.n + 1, r: grises.r + r, g: grises.g + g, b: grises.b + b };
        continue;
      }
      const clave = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const c = cubetas.get(clave) ?? { peso: 0, r: 0, g: 0, b: 0 };
      const peso = 0.35 + s; // prefiere colores saturados
      c.peso += peso; c.r += r * peso; c.g += g * peso; c.b += b * peso;
      cubetas.set(clave, c);
    }
  }

  let base: [number, number, number];
  const mejor = [...cubetas.values()].sort((a, b) => b.peso - a.peso)[0];
  if (mejor && mejor.peso > 0) base = [mejor.r / mejor.peso, mejor.g / mejor.peso, mejor.b / mejor.peso];
  else if (grises.n > 0) base = [grises.r / grises.n, grises.g / grises.n, grises.b / grises.n];
  else return '#3b6cf2'; // logo totalmente blanco/negro/transparente: azul de marca

  // Luminosidad utilizable como acento (botones, enlaces) en claro y oscuro.
  const [h, s, l] = rgbAHsl(...base);
  return aHex(...hslARgb(h, s, Math.min(0.58, Math.max(0.38, l))));
}

export class AnalizadorLogoPng implements IAnalizadorLogo {
  analizar(bytes: Uint8Array): ResultadoAnalisisLogo {
    if (bytes.length === 0) return { ok: false, error: 'El logo está vacío.' };
    if (bytes.length > LOGO_MAX_BYTES) return { ok: false, error: 'El logo no puede pesar más de 1 MB.' };
    if (!FIRMA_PNG.every((v, i) => bytes[i] === v)) return { ok: false, error: 'El logo debe ser una imagen PNG.' };

    let png: { width: number; height: number; data: Uint8Array };
    try {
      png = PNG.sync.read(Buffer.from(bytes));
    } catch {
      return { ok: false, error: 'No se pudo leer el PNG: el archivo está dañado.' };
    }
    if (png.width > LOGO_MAX_LADO || png.height > LOGO_MAX_LADO) {
      return { ok: false, error: `El logo no puede medir más de ${LOGO_MAX_LADO} px por lado.` };
    }
    return { ok: true, colorPrincipal: colorPrincipalDesdeRgba(png.data, png.width, png.height), ancho: png.width, alto: png.height };
  }
}
