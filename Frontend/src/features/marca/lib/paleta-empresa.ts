/**
 * paleta-empresa.ts — Paleta "Mi empresa": se genera a partir del color principal del logo.
 *
 * La primera vez que llega una marca (o cuando cambia el logo) se activa sola; después el
 * usuario puede elegir otra paleta en el selector y su elección se respeta.
 * Las variables quedan en localStorage para que el script del layout pinte sin parpadeo.
 */

import {
  aplicarVariablesPersonalizadasEnDom,
  generarVariablesDesdeConfig,
  limpiarVariablesPersonalizadasEnDom,
  mezclarHex,
  type ConfiguracionPaletaPersonalizada,
} from '@/lib/generadorPaleta';
import { esRutaConAparienciaPersonalizable } from '@/lib/apariencia-ruta';
import { STORAGE_KEYS } from '@/lib/storage-keys';

export const ID_PALETA_EMPRESA = 'empresa';

/** Configuración completa de la paleta derivada de un solo color. */
export function configDesdeColor(color: string): ConfiguracionPaletaPersonalizada {
  return {
    acento: color,
    fondoOscuro: mezclarHex(color, '#05070d', 0.1),
    luz1: mezclarHex(color, '#000000', 0.8),
    luz2: mezclarHex(color, '#4f46e5', 0.55),
    luz3: mezclarHex(color, '#06b6d4', 0.55),
  };
}

/** Activa la paleta "Mi empresa" en el documento (solo si estamos en un panel) y la deja como preferida. */
export function activarPaletaEmpresa(color: string): void {
  const config = configDesdeColor(color);
  try {
    localStorage.setItem(STORAGE_KEYS.paletaEmpresaVars, JSON.stringify(generarVariablesDesdeConfig(config)));
    localStorage.setItem(STORAGE_KEYS.paleta, ID_PALETA_EMPRESA);
    localStorage.setItem(STORAGE_KEYS.marcaAplicada, color);
  } catch {}
  if (typeof window !== 'undefined' && esRutaConAparienciaPersonalizable(window.location.pathname)) {
    limpiarVariablesPersonalizadasEnDom();
    aplicarVariablesPersonalizadasEnDom(config);
    document.documentElement.setAttribute('data-paleta', ID_PALETA_EMPRESA);
  }
}

/** Llega la marca de la empresa: la activa si es nueva o si ya era la paleta elegida. */
export function aplicarPaletaEmpresa(color: string): void {
  if (typeof document === 'undefined') return;
  let yaAplicada: string | null = null;
  let preferida: string | null = null;
  try {
    yaAplicada = localStorage.getItem(STORAGE_KEYS.marcaAplicada);
    preferida = localStorage.getItem(STORAGE_KEYS.paleta);
  } catch {}
  if (yaAplicada !== color || preferida === ID_PALETA_EMPRESA) activarPaletaEmpresa(color);
}

/**
 * Quita la paleta "Mi empresa" (al cerrar sesión o si la empresa no tiene logo) para que
 * otra sesión no herede los colores de otra empresa. Si el usuario eligió otra paleta, se respeta.
 */
export function retirarPaletaEmpresa(): void {
  if (typeof document === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.marcaAplicada);
    localStorage.removeItem(STORAGE_KEYS.paletaEmpresaVars);
    if (localStorage.getItem(STORAGE_KEYS.paleta) === ID_PALETA_EMPRESA) localStorage.setItem(STORAGE_KEYS.paleta, 'zafiro');
  } catch {}
  if (document.documentElement.getAttribute('data-paleta') === ID_PALETA_EMPRESA) {
    limpiarVariablesPersonalizadasEnDom();
    document.documentElement.setAttribute('data-paleta', 'zafiro');
  }
}
