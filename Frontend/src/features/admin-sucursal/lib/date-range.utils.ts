/**
 * date-range.utils.ts — Utilidades puras para cálculo, validación y formateo de rangos de fechas (Fase 6).
 *
 * Trabaja estrictamente con fechas calendario interpretadas en la zona horaria operativa (America/Bogotá).
 */

export type PresetReporte = 'hoy' | '7d' | '30d' | 'mes' | 'personalizado';

export interface RangoPresetResultado {
  desde: string;
  hasta: string;
}

export interface ValidacionRangoResultado {
  valido: boolean;
  error?: string;
  dias?: number;
}

export interface VariacionFormateada {
  texto: string;
  variante: 'success' | 'danger' | 'neutral';
  icono: 'up' | 'down' | 'equal';
}

const PAD = (n: number) => String(n).padStart(2, '0');

/**
 * Obtiene la fecha actual en America/Bogotá en formato YYYY-MM-DD.
 */
export function obtenerHoyBogota(): string {
  // America/Bogotá es UTC-5 constante sin horario de verano
  const ahora = new Date();
  const utc = ahora.getTime() + ahora.getTimezoneOffset() * 60000;
  const bogota = new Date(utc - 5 * 3600000);
  return `${bogota.getFullYear()}-${PAD(bogota.getMonth() + 1)}-${PAD(bogota.getDate())}`;
}

/**
 * Genera el rango de fechas en string YYYY-MM-DD para un preset determinado.
 */
export function obtenerRangoPreset(preset: PresetReporte): RangoPresetResultado {
  const hoyStr = obtenerHoyBogota();
  if (preset === 'hoy') {
    return { desde: hoyStr, hasta: hoyStr };
  }

  const [y, m, d] = hoyStr.split('-').map(Number);
  const fechaHoy = new Date(Date.UTC(y, m - 1, d));

  if (preset === '7d') {
    const fDesde = new Date(fechaHoy);
    fDesde.setUTCDate(fDesde.getUTCDate() - 6);
    const desdeStr = `${fDesde.getUTCFullYear()}-${PAD(fDesde.getUTCMonth() + 1)}-${PAD(fDesde.getUTCDate())}`;
    return { desde: desdeStr, hasta: hoyStr };
  }

  if (preset === '30d') {
    const fDesde = new Date(fechaHoy);
    fDesde.setUTCDate(fDesde.getUTCDate() - 29);
    const desdeStr = `${fDesde.getUTCFullYear()}-${PAD(fDesde.getUTCMonth() + 1)}-${PAD(fDesde.getUTCDate())}`;
    return { desde: desdeStr, hasta: hoyStr };
  }

  if (preset === 'mes') {
    const desdeStr = `${y}-${PAD(m)}-01`;
    return { desde: desdeStr, hasta: hoyStr };
  }

  // Por defecto (7d)
  return obtenerRangoPreset('7d');
}

/**
 * Valida consistencia de rango y límite de 366 días.
 */
export function validarRangoFechas(desde: string, hasta: string): ValidacionRangoResultado {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(desde) || !regex.test(hasta)) {
    return { valido: false, error: 'Formato de fecha inválido. Utilice AAAA-MM-DD.' };
  }

  const [y1, m1, d1] = desde.split('-').map(Number);
  const [y2, m2, d2] = hasta.split('-').map(Number);

  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);

  if (isNaN(t1) || isNaN(t2)) {
    return { valido: false, error: 'Fecha inválida.' };
  }

  if (t1 > t2) {
    return { valido: false, error: 'La fecha inicial no puede ser posterior a la fecha final.' };
  }

  const msPorDia = 86400000;
  const dias = Math.round((t2 - t1) / msPorDia) + 1;

  if (dias > 366) {
    return { valido: false, error: 'El rango de fechas no puede exceder los 366 días.', dias };
  }

  return { valido: true, dias };
}

/**
 * Formatea la variación porcentual y absoluta con signo e indicador visual.
 */
export function formatearVariacion(
  varAbs: number,
  varPct: number | null,
  inverso = false,
): VariacionFormateada {
  if (varPct === null || isNaN(varPct)) {
    return { texto: 'Sin datos previos', variante: 'neutral', icono: 'equal' };
  }

  const signo = varPct > 0 ? '+' : '';
  const texto = `${signo}${varPct.toFixed(1)}%`;

  if (varPct === 0) {
    return { texto: '0.0%', variante: 'neutral', icono: 'equal' };
  }

  if (varPct > 0) {
    return {
      texto,
      variante: inverso ? 'danger' : 'success',
      icono: 'up',
    };
  }

  return {
    texto,
    variante: inverso ? 'success' : 'danger',
    icono: 'down',
  };
}

/**
 * Formatea una fecha YYYY-MM-DD en texto amigable (ej: 19 nov. 2026).
 */
export function formatearFechaCorta(yyyyMmDd: string): string {
  try {
    const [y, m, d] = yyyyMmDd.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return yyyyMmDd;
  }
}
