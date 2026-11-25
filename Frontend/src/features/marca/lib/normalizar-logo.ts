/**
 * normalizar-logo.ts — Recorte automático de bordes transparentes y análisis óptico del PNG.
 *
 * Resuelve que cualquier tipo de logo (cuadrado con mucho margen vacío, escudo vertical al ras
 * o logotipo panorámico horizontal, claro, oscuro o a color) se vea equilibrado en todo el panel.
 */

export type TonoLogo = 'color' | 'oscuro' | 'claro';

export interface LogoNormalizado {
  url: string;
  /** Relación ancho / alto real del contenido visible (acotada entre 0.25 y 8). */
  proporcion: number;
  /** Permite invertir o dar contraste si el logo es negro puro o blanco puro. */
  tonoLogo: TonoLogo;
}

const MAX_LADO_ANALISIS = 1024;
const UMBRAL_ALFA = 16;

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo decodificar el PNG.'));
    img.src = url;
  });
}

function canvasABlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

export async function normalizarLogoBlob(blob: Blob): Promise<LogoNormalizado> {
  if (typeof document === 'undefined') {
    return { url: URL.createObjectURL(blob), proporcion: 1, tonoLogo: 'color' };
  }

  const tempUrl = URL.createObjectURL(blob);
  try {
    const img = await cargarImagen(tempUrl);
    const w0 = img.naturalWidth || img.width;
    const h0 = img.naturalHeight || img.height;
    if (!w0 || !h0) {
      return { url: URL.createObjectURL(blob), proporcion: 1, tonoLogo: 'color' };
    }

    const escala = Math.min(1, MAX_LADO_ANALISIS / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * escala));
    const h = Math.max(1, Math.round(h0 * escala));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return { url: URL.createObjectURL(blob), proporcion: Math.max(0.25, Math.min(8, w0 / h0)), tonoLogo: 'color' };
    }

    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);

    let minX = w;
    let minY = h;
    let maxX = -1;
    let maxY = -1;
    let sumaLuminancia = 0;
    let sumaSaturacion = 0;
    let pesoTotal = 0;

    for (let y = 0; y < h; y++) {
      const filaOffset = y * w * 4;
      for (let x = 0; x < w; x++) {
        const i = filaOffset + x * 4;
        const a = data[i + 3];
        if (a <= UMBRAL_ALFA) continue;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const peso = a / 255;
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;

        sumaLuminancia += lum * peso;
        sumaSaturacion += sat * peso;
        pesoTotal += peso;
      }
    }

    if (maxX < minX || maxY < minY || pesoTotal === 0) {
      return { url: URL.createObjectURL(blob), proporcion: Math.max(0.25, Math.min(8, w0 / h0)), tonoLogo: 'color' };
    }

    const lumMedia = sumaLuminancia / pesoTotal;
    const satMedia = sumaSaturacion / pesoTotal;
    const tonoLogo: TonoLogo =
      satMedia < 0.2 && lumMedia < 0.22
        ? 'oscuro'
        : satMedia < 0.2 && lumMedia > 0.85
        ? 'claro'
        : 'color';

    // Convertimos la caja detectada a coordenadas de la imagen original para no perder resolución.
    const origMinX = Math.max(0, Math.floor(minX / escala));
    const origMinY = Math.max(0, Math.floor(minY / escala));
    const origMaxX = Math.min(w0 - 1, Math.ceil((maxX + 1) / escala) - 1);
    const origMaxY = Math.min(h0 - 1, Math.ceil((maxY + 1) / escala) - 1);
    const cropW = Math.max(1, origMaxX - origMinX + 1);
    const cropH = Math.max(1, origMaxY - origMinY + 1);
    const proporcion = Math.max(0.25, Math.min(8, cropW / cropH));

    const tieneMargenSignificativo = cropW < w0 * 0.96 || cropH < h0 * 0.96;
    if (!tieneMargenSignificativo) {
      return { url: URL.createObjectURL(blob), proporcion, tonoLogo };
    }

    const recortado = document.createElement('canvas');
    recortado.width = cropW;
    recortado.height = cropH;
    const ctxRecorte = recortado.getContext('2d');
    if (!ctxRecorte) {
      return { url: URL.createObjectURL(blob), proporcion, tonoLogo };
    }
    ctxRecorte.drawImage(img, origMinX, origMinY, cropW, cropH, 0, 0, cropW, cropH);
    const nuevoBlob = await canvasABlob(recortado);
    return {
      url: URL.createObjectURL(nuevoBlob ?? blob),
      proporcion,
      tonoLogo,
    };
  } catch {
    return { url: URL.createObjectURL(blob), proporcion: 1, tonoLogo: 'color' };
  } finally {
    URL.revokeObjectURL(tempUrl);
  }
}

/**
 * Calcula ancho y alto ópticos equilibrados manteniendo un área visual constante (~185.000 px²),
 * acotados dentro de una caja máxima segura (700 × 420 px) para que logos verticales, cuadrados
 * y panorámicos tengan el mismo peso visual sin desbordar.
 */
export function calcularDimensionesMarcaAgua(proporcion: number): { ancho: number; alto: number } {
  const AREA_OBJETIVO = 185_000;
  const MAX_ANCHO = 700;
  const MAX_ALTO = 420;

  const r = Math.max(0.25, Math.min(8, proporcion || 1));
  let ancho = Math.sqrt(AREA_OBJETIVO * r);
  let alto = Math.sqrt(AREA_OBJETIVO / r);

  if (ancho > MAX_ANCHO) {
    ancho = MAX_ANCHO;
    alto = MAX_ANCHO / r;
  }
  if (alto > MAX_ALTO) {
    alto = MAX_ALTO;
    ancho = MAX_ALTO * r;
  }

  return {
    ancho: Math.round(ancho),
    alto: Math.round(alto),
  };
}
