import { assertEquals } from 'jsr:@std/assert@1';
import { AnalizadorLogoPng, colorPrincipalDesdeRgba } from '../../src/marca/analizador-logo.ts';

/** Imagen RGBA de prueba: rellena con `fondo` y pinta un bloque `color` en el `parte` central. */
function imagen(ancho: number, alto: number, fondo: number[], color: number[], parte = 0.4): Uint8Array {
  const d = new Uint8Array(ancho * alto * 4);
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const dentro = Math.abs(x - ancho / 2) < (ancho * parte) / 2 && Math.abs(y - alto / 2) < (alto * parte) / 2;
      d.set(dentro ? color : fondo, (y * ancho + x) * 4);
    }
  }
  return d;
}

Deno.test('Color principal: ignora el fondo transparente y el blanco', () => {
  assertEquals(colorPrincipalDesdeRgba(imagen(100, 100, [0, 0, 0, 0], [220, 38, 38, 255]), 100, 100), '#dc2626');
  assertEquals(colorPrincipalDesdeRgba(imagen(100, 100, [255, 255, 255, 255], [34, 197, 94, 255]), 100, 100), '#22c55e');
});

Deno.test('Color principal: ajusta la luminosidad para que sirva como acento', () => {
  const muyOscuro = colorPrincipalDesdeRgba(imagen(50, 50, [0, 0, 0, 0], [20, 30, 90, 255], 1), 50, 50);
  const muyClaro = colorPrincipalDesdeRgba(imagen(50, 50, [0, 0, 0, 0], [190, 210, 255, 255], 1), 50, 50);
  const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255]; return (Math.max(...c) + Math.min(...c)) / 510; };
  assertEquals(lum(muyOscuro) >= 0.37, true);
  assertEquals(lum(muyClaro) <= 0.59, true);
});

Deno.test('Color principal: logo sin color usa su gris; logo vacío usa el azul de marca', () => {
  assertEquals(colorPrincipalDesdeRgba(imagen(40, 40, [0, 0, 0, 0], [110, 110, 110, 255], 1), 40, 40), '#6e6e6e');
  assertEquals(colorPrincipalDesdeRgba(imagen(40, 40, [0, 0, 0, 0], [0, 0, 0, 0], 1), 40, 40), '#3b6cf2');
});

Deno.test('Analizador: solo acepta PNG reales y de máximo 1 MB', async () => {
  const a = new AnalizadorLogoPng();
  assertEquals(a.analizar(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])).ok, false); // JPEG
  assertEquals(a.analizar(new Uint8Array(1024 * 1024 + 1)).ok, false);
  const real = await Deno.readFile(new URL('../../../../../Frontend/src/app/apple-icon.png', import.meta.url));
  const r = a.analizar(real);
  assertEquals(r.ok, true);
  // El isotipo de Inventa: estrella ámbar sobre negro → color principal ámbar.
  assertEquals(r.ok && r.colorPrincipal.startsWith('#f'), true);
});
