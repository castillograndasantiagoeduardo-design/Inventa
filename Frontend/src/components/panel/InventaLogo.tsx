/**
 * InventaLogo.tsx — Isotipo cuadrado de Inventa: estrella ámbar sobre una "i" crema
 * en fondo negro obsidiana. Fuente: _rebrand-inventa/logos/inventa-isotipo.svg.
 */

export function InventaLogo({ className = 'w-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 368 368"
      xmlns="http://www.w3.org/2000/svg"
      className={`h-auto block shrink-0 ${className}`}
      role="img"
      aria-label="Logo Inventa"
    >
      <rect width="368" height="368" fill="#18181B" />
      <path d="M184 59 Q196 89 226 101 Q196 113 184 143 Q172 113 142 101 Q172 89 184 59 Z" fill="#F59E0B" />
      <rect x="162" y="166" width="44" height="147" fill="#FFFDF9" />
    </svg>
  );
}
