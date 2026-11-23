/**
 * auth.estilos.ts — Clases compartidas de la tarjeta de acceso (vidrio + paleta activa).
 *
 * Mismo lenguaje visual que el panel de Admin de sucursal y la landing: tokens de Tailwind
 * (text-text, border-border, brand-*, superficie-control) en lugar de hex sueltos, para que
 * respete el modo claro/oscuro y la paleta elegida.
 */

/** Título de la tarjeta ("Iniciar sesión", "Crear cuenta", "Segundo factor"). */
export const TITULO = 'font-titulos text-[26px] leading-8 font-semibold tracking-[-0.005em] text-text text-center';

/** Palabra resaltada dentro del título. */
export const TITULO_ACENTO = 'text-brand-600 dark:text-brand-300';

/** Etiqueta de campo. */
export const ETIQUETA = 'block font-sans text-[13px] font-medium text-text';

/** Contenedor de un campo de texto (normal / con error). */
export const CAMPO =
  'superficie-control rounded-[10px] px-3.5 py-2.5 border border-border transition-all focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/25';
export const CAMPO_ERROR =
  'superficie-control rounded-[10px] px-3.5 py-2.5 border border-red-500/70 transition-all focus-within:ring-2 focus-within:ring-red-500/25';

/** Input dentro de CAMPO. */
export const INPUT =
  'w-full bg-transparent font-sans text-sm text-text placeholder:text-text-muted/60 focus:outline-none disabled:opacity-50';

/** Mensaje de error bajo un campo. */
export const ERROR_CAMPO = 'font-sans text-xs text-red-600 dark:text-red-400 mt-1';

/** Botón primario de envío (ancho completo). */
export const BOTON_PRIMARIO =
  'w-full flex items-center justify-center gap-2 rounded-[10px] py-3 px-5 font-sans text-sm font-medium bg-brand-600 text-btn-primario-texto shadow-lg shadow-brand-600/30 hover:bg-brand-500 active:scale-[0.98] transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

/** Botón secundario (contorno). */
export const BOTON_SECUNDARIO =
  'min-h-[40px] px-5 py-2 rounded-[10px] superficie-control border border-border text-text font-sans text-[13px] font-medium cursor-pointer hover:border-brand-500/40 transition-colors';

/** Enlace de texto. */
export const ENLACE =
  'font-sans text-[13px] text-brand-600 dark:text-brand-300 hover:underline transition-colors focus-visible:outline-none focus-visible:underline';

/** Texto separador ("o usa tu correo institucional"). */
export const SEPARADOR = 'font-sans text-xs text-center text-text-muted mb-4';

/** Aviso de error general (alerta roja). */
export const ALERTA_ERROR =
  'rounded-[10px] px-3.5 py-2.5 mb-3 bg-red-50 text-red-700 dark:bg-red-500/12 dark:text-red-300 ring-1 ring-inset ring-red-600/25 font-sans text-xs leading-snug animate-in fade-in duration-200';

/** Caja informativa sobre superficie de control. */
export const CAJA_INFO = 'superficie-control rounded-[10px] border border-border p-3.5 font-sans text-[13px] text-text-muted leading-relaxed';
