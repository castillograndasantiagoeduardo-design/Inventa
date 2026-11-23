/**
 * storage-keys.ts — Claves de localStorage de la app (preferencias de apariencia).
 *
 * Fuente única de verdad para los componentes. El script inline
 * `scriptInicializacionTema` de `app/layout.tsx` no puede importar módulos, así que
 * repite estas claves en literal: si cambias una aquí, cámbiala también allí.
 */

export const STORAGE_KEYS = {
  tema: 'inventa-tema',
  paleta: 'inventa-paleta',
  fondo: 'inventa-fondo',
  paletaCustom: 'inventa-paleta-custom',
  paletaCustomVars: 'inventa-paleta-custom-vars',
} as const;

/** Claves anteriores al rebrand (Warengine → Inventa); el layout las migra al cargar. */
export const LEGACY_STORAGE_KEYS = {
  tema: 'warengine-tema',
  paleta: 'warengine-paleta',
  fondo: 'warengine-fondo',
  paletaCustom: 'warengine-paleta-custom',
  paletaCustomVars: 'warengine-paleta-custom-vars',
} as const;
