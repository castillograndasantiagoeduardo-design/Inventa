/**
 * EstrellaInventa.tsx — Estrella de cuatro puntas del logo de Inventa, en ámbar.
 * Acento decorativo para etiquetas e insignias de la landing.
 */

export function EstrellaInventa({ className = 'size-2.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 84 84" aria-hidden="true" className={`shrink-0 fill-ambar ${className}`}>
      <path d="M42 0 Q54 30 84 42 Q54 54 42 84 Q30 54 0 42 Q30 30 42 0 Z" />
    </svg>
  );
}
