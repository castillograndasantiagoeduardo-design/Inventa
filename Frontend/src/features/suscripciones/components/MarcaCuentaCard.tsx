'use client';

/**
 * MarcaCuentaCard.tsx — "Marca de tu empresa" en Mi cuenta: logo actual, color principal
 * detectado y opción de cambiar el logo (solo PNG). Si la cuenta ya tiene empresa, el
 * cambio también se ve en su panel.
 */

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { SelectorLogoPng, marcaStore, normalizarLogoBlob } from '@/features/marca';
import { suscripcionesService } from '../api/suscripciones.service';

interface MarcaCuentaCardProps {
  colorPrincipal: string | null;
  logoVersion: string | null;
  onCambio: (marca: { colorPrincipal: string; logoVersion: string }) => void;
}

export function MarcaCuentaCard({ colorPrincipal, logoVersion, onCambio }: MarcaCuentaCardProps) {
  const [logoActual, setLogoActual] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // El logo se pide con la sesión de la cuenta, se normaliza (recorte de bordes vacíos) y se expone como URL de objeto.
  useEffect(() => {
    if (!logoVersion) return;
    let url: string | null = null;
    let vivo = true;
    fetch(suscripcionesService.urlLogo(logoVersion), { credentials: 'include' })
      .then((r) => (r.ok ? r.blob() : null))
      .then(async (blob) => {
        if (!blob || !vivo) return;
        const normalizado = await normalizarLogoBlob(blob);
        if (!vivo) {
          URL.revokeObjectURL(normalizado.url);
          return;
        }
        url = normalizado.url;
        setLogoActual(url);
      })
      .catch(() => null);
    return () => {
      vivo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [logoVersion]);

  const guardar = async () => {
    if (!nuevo) return;
    setGuardando(true);
    setError(undefined);
    setAviso(null);
    try {
      const marca = await suscripcionesService.actualizarLogo(nuevo);
      marcaStore.reiniciar(); // el panel volverá a pedir la marca nueva
      setNuevo(null);
      setAviso('Logo actualizado. Tu panel usará el nuevo color.');
      onCambio(marca);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el logo. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section aria-labelledby="marca-cuenta" className="vidrio rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:items-center">
      <div className="flex-1 flex flex-col gap-2">
        <h2 id="marca-cuenta" className="font-titulos text-xl font-semibold text-text">Marca de tu empresa</h2>
        <p className="text-sm text-text-muted">
          Tu logo aparece en tu perfil y de fondo en todo el panel. Su color principal se usa como color de la interfaz.
        </p>
        {colorPrincipal && (
          <p className="flex items-center gap-2 text-sm text-text">
            <span
              aria-hidden="true"
              className="size-5 rounded-full ring-1 ring-black/20"
              style={{ backgroundColor: colorPrincipal }}
            />
            Color principal: <span className="font-mono uppercase">{colorPrincipal}</span>
          </p>
        )}
        {aviso && <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">{aviso}</p>}
      </div>
      <div className="w-full md:w-[340px] flex flex-col gap-3">
        <SelectorLogoPng
          valor={nuevo ?? logoActual}
          onCambio={(dataUrl) => { setNuevo(dataUrl); setAviso(null); setError(undefined); }}
          error={error}
          etiqueta={nuevo ? 'Nuevo logo' : 'Logo actual'}
          ayuda="Solo PNG, máximo 1 MB."
          deshabilitado={guardando}
        />
        {nuevo && (
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setNuevo(null)}
              disabled={guardando}
              className="px-3 py-2 rounded-lg text-[13px] font-medium text-text-muted hover:text-text cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-btn-primario-texto text-[13px] font-semibold cursor-pointer disabled:opacity-60"
            >
              {guardando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Guardar logo
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
