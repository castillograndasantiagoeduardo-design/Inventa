/**
 * InventaWordmark.tsx — Logotipo de Inventa: "inventa" en minúsculas con la fuente
 * Outfit (--font-ui) y la estrella ámbar del isotipo en lugar del punto de la "i".
 *
 * La "i" es la ı sin punto (U+0131). El texto usa `currentColor`, así que el color
 * lo define quien lo usa (ej. `text-[#18181B]` en claro o `text-white` en oscuro).
 * El tamaño se controla con `text-*`: la estrella está en `em` y escala con el texto.
 */

export function InventaWordmark({ className = '' }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Inventa"
      className={`inline-flex items-baseline font-[family-name:var(--font-ui)] font-semibold lowercase leading-none tracking-tight select-none ${className}`}
    >
      <span aria-hidden="true" className="relative inline-block">
        {'ı'}
        <svg
          viewBox="0 0 84 84"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-1/2 -translate-x-1/2 w-[0.44em] h-[0.44em]"
          style={{ top: '-0.07em' }}
        >
          <path d="M42 0 Q54 30 84 42 Q54 54 42 84 Q30 54 0 42 Q30 30 42 0 Z" fill="#F59E0B" />
        </svg>
      </span>
      <span aria-hidden="true">nventa</span>
    </span>
  );
}
