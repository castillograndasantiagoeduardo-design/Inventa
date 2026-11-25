'use client';

/**
 * SelectorLogoPng.tsx — Campo para subir el logo de la empresa (solo PNG, máx. 1 MB).
 * Valida el tipo y el peso en el navegador, muestra la vista previa y entrega el
 * PNG como data URL (base64). El servidor vuelve a validarlo y detecta su color principal.
 */

import React, { useId, useRef, useState } from 'react';
import { ImageUp } from 'lucide-react';

export const LOGO_MAX_BYTES = 1024 * 1024;
const FIRMA_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Lee el archivo y lo devuelve como data URL si es un PNG válido; si no, lanza el motivo. */
export async function leerLogoPng(archivo: File): Promise<string> {
  if (archivo.size > LOGO_MAX_BYTES) throw new Error('El logo no puede pesar más de 1 MB.');
  const cabecera = new Uint8Array(await archivo.slice(0, 8).arrayBuffer());
  if (archivo.type !== 'image/png' || !FIRMA_PNG.every((v, i) => cabecera[i] === v)) {
    throw new Error('El logo debe ser una imagen PNG.');
  }
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    lector.readAsDataURL(archivo);
  });
}

interface SelectorLogoPngProps {
  /** Data URL del PNG elegido (o URL del logo actual), para la vista previa. */
  valor: string | null;
  onCambio: (dataUrl: string) => void;
  error?: string;
  etiqueta?: string;
  /** Texto bajo la etiqueta. */
  ayuda?: string;
  deshabilitado?: boolean;
}

export function SelectorLogoPng({
  valor,
  onCambio,
  error,
  etiqueta = 'Logo de tu empresa',
  ayuda = 'Solo PNG, máximo 1 MB. Usaremos su color principal en tu panel.',
  deshabilitado = false,
}: SelectorLogoPngProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const mensaje = errorLocal ?? error;

  const elegir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!archivo) return;
    try {
      onCambio(await leerLogoPng(archivo));
      setErrorLocal(null);
    } catch (err) {
      setErrorLocal(err instanceof Error ? err.message : 'No se pudo leer el logo.');
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block font-sans text-[13px] font-medium text-text mb-1.5">{etiqueta}</label>
      <div
        className={`flex items-center gap-3 rounded-[10px] border p-2.5 superficie-control ${
          mensaje ? 'border-red-500/70' : 'border-border'
        }`}
      >
        <div className="w-24 h-14 shrink-0 rounded-xl bg-white ring-1 ring-slate-900/12 dark:ring-white/25 shadow-sm flex items-center justify-center overflow-hidden p-1.5">
          {valor ? (
            // eslint-disable-next-line @next/next/no-img-element -- vista previa local (data URL)
            <img src={valor} alt="Vista previa del logo" className="w-full h-full object-contain contrast-[1.05] saturate-[1.06]" />
          ) : (
            <ImageUp className="size-6 text-slate-400" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-xs text-text-muted leading-snug">{ayuda}</p>
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={deshabilitado}
            className="mt-1.5 font-sans text-[13px] font-medium text-brand-600 dark:text-brand-300 hover:underline cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {valor ? 'Cambiar logo' : 'Elegir archivo PNG'}
          </button>
        </div>
        <input
          ref={input}
          id={id}
          type="file"
          accept="image/png"
          onChange={elegir}
          disabled={deshabilitado}
          className="sr-only"
          aria-invalid={!!mensaje}
        />
      </div>
      {mensaje && <p className="font-sans text-xs text-red-600 dark:text-red-400 mt-1">{mensaje}</p>}
    </div>
  );
}
