/**
 * apariencia-ruta.ts — Aísla la personalización estética (paletas de cuenta,
 * color de logo corporativo, efectos de fondo y transparencia de tarjetas)
 * exclusivamente a los paneles operativos de una cuenta.
 *
 * La Landing (/), el login (/acceso, /recuperar-password) y el portal comercial
 * (/registro, /cuenta, /pago/*) conservan siempre los colores estáticos oficiales
 * de Inventa (Zafiro + acentos Ámbar, fondo Retícula + luz y opacidad base).
 */

import { limpiarVariablesPersonalizadasEnDom } from './generadorPaleta';
import { STORAGE_KEYS } from './storage-keys';

const REGEX_RUTA_PANEL = /^\/(dashboard|admin-sucursal|vendedor-b2b|pos)(\/|$)/;

/**
 * Indica si la ruta pertenece a un espacio operativo interno donde aplica
 * la estética personalizada de la cuenta/empresa.
 */
export function esRutaConAparienciaPersonalizable(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  return REGEX_RUTA_PANEL.test(pathname);
}

/**
 * Sincroniza los atributos y variables CSS de `<html>` según la ruta activa,
 * sin borrar `localStorage` para preservar la estética de la cuenta al volver al panel.
 */
export function sincronizarAparienciaSegunRuta(
  pathname: string | null | undefined,
): void {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;

  if (!esRutaConAparienciaPersonalizable(pathname)) {
    limpiarVariablesPersonalizadasEnDom();
    html.style.removeProperty('--card-opacidad');
    html.setAttribute('data-paleta', 'zafiro');
    html.setAttribute('data-fondo', 'malla');
    return;
  }

  try {
    const paleta = localStorage.getItem(STORAGE_KEYS.paleta) || 'zafiro';
    const fondo = localStorage.getItem(STORAGE_KEYS.fondo) || 'malla';
    const transpRaw = localStorage.getItem(STORAGE_KEYS.transparenciaCards);

    limpiarVariablesPersonalizadasEnDom();
    html.setAttribute('data-paleta', paleta);
    html.setAttribute('data-fondo', fondo);

    if (paleta === 'personalizada' || paleta === 'empresa') {
      const claveVars =
        paleta === 'empresa'
          ? STORAGE_KEYS.paletaEmpresaVars
          : STORAGE_KEYS.paletaCustomVars;
      const varsRaw = localStorage.getItem(claveVars);
      if (varsRaw) {
        const varsObj = JSON.parse(varsRaw) as Record<string, string>;
        for (const [clave, valor] of Object.entries(varsObj)) {
          if (typeof valor === 'string') {
            html.style.setProperty(clave, valor);
          }
        }
      }
    }

    if (transpRaw !== null) {
      const transp = Math.max(0, Math.min(95, Number(transpRaw)));
      if (!Number.isNaN(transp)) {
        html.style.setProperty('--card-opacidad', `${100 - transp}%`);
      } else {
        html.style.removeProperty('--card-opacidad');
      }
    } else {
      html.style.removeProperty('--card-opacidad');
    }
  } catch {
    limpiarVariablesPersonalizadasEnDom();
    html.style.removeProperty('--card-opacidad');
    html.setAttribute('data-paleta', 'zafiro');
    html.setAttribute('data-fondo', 'malla');
  }
}
