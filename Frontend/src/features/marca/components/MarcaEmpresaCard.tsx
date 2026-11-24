'use client';

/**
 * MarcaEmpresaCard.tsx — Tarjeta de identidad visual de la empresa dentro del panel (/dashboard/cuenta).
 *
 * Muestra el logo actual, el color principal detectado y permite al Super Admin subir un nuevo
 * PNG (≤ 1 MB), actualizando al instante el avatar, la marca de agua y la paleta "Mi empresa".
 */

import React, { useState } from 'react';
import { Palette, Sparkles } from 'lucide-react';
import { PERMISSIONS } from '@inventa/contracts';
import { usePermissions } from '@/features/autenticacion';
import { Button3D } from '@/components/ui/Button3D';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { useMarcaEmpresa } from '../hooks/useMarcaEmpresa';
import { activarPaletaEmpresa } from '../lib/paleta-empresa';
import { actualizarLogoEmpresaPanel } from '../lib/marca.store';
import { SelectorLogoPng } from './SelectorLogoPng';

export function MarcaEmpresaCard() {
  const toast = useToast();
  const { tienePermiso } = usePermissions();
  const puedeEditar = tienePermiso(PERMISSIONS.ADMIN_GESTIONAR_SUCURSALES);
  const { colorPrincipal, logoUrl } = useMarcaEmpresa();

  const [nuevoLogo, setNuevoLogo] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!nuevoLogo) return;
    setGuardando(true);
    setError(undefined);
    try {
      const marca = await actualizarLogoEmpresaPanel(nuevoLogo);
      setNuevoLogo(null);
      toast.success(`Logo actualizado. Nuevo color de marca: ${marca.colorPrincipal.toUpperCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el logo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section
      aria-labelledby="titulo-marca-empresa"
      className="panel-card p-5 sm:p-6 flex flex-col lg:flex-row gap-6 lg:items-center"
    >
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-100 border border-brand-200 text-brand-700 dark:bg-brand-500/15 dark:border-brand-400/20 dark:text-brand-300 flex items-center justify-center shrink-0">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h2 id="titulo-marca-empresa" className="font-titulos font-semibold tracking-[-0.005em] text-lg text-text">
              Marca e identidad de la empresa
            </h2>
            <p className="text-xs text-text-muted">
              El logo se proyecta en la cápsula de perfil, como marca de agua del panel y define el tema «Mi empresa».
            </p>
          </div>
        </div>

        {colorPrincipal ? (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl superficie-control text-xs">
              <span
                aria-hidden="true"
                className="w-4 h-4 rounded-full ring-1 ring-black/20 dark:ring-white/25 shrink-0"
                style={{ backgroundColor: colorPrincipal }}
              />
              <span className="text-text-muted">Color detectado:</span>
              <span className="font-mono font-semibold text-text uppercase">{colorPrincipal}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                activarPaletaEmpresa(colorPrincipal);
                toast.info('Tema «Mi empresa» aplicado en el panel.');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl superficie-control text-xs font-medium text-brand-600 dark:text-brand-300 hover:text-text transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Aplicar color del logo
            </button>
          </div>
        ) : (
          <p className="text-xs text-text-muted">
            Aún no hay un logo registrado para esta empresa. Sube un archivo PNG para generar automáticamente la paleta corporativa.
          </p>
        )}
      </div>

      {puedeEditar && (
        <div className="w-full lg:w-[360px] flex flex-col gap-3 shrink-0">
          <SelectorLogoPng
            valor={nuevoLogo ?? logoUrl}
            onCambio={(dataUrl) => {
              setNuevoLogo(dataUrl);
              setError(undefined);
            }}
            error={error}
            etiqueta={nuevoLogo ? 'Nuevo logo seleccionado' : 'Logo actual de la empresa'}
            ayuda="Solo formato PNG, máximo 1 MB."
            deshabilitado={guardando}
          />
          {nuevoLogo && (
            <div className="flex flex-wrap justify-end gap-2.5">
              <Button3D
                size="panel-sm"
                variant="navy"
                type="button"
                onClick={() => {
                  setNuevoLogo(null);
                  setError(undefined);
                }}
                disabled={guardando}
              >
                Cancelar
              </Button3D>
              <Button3D size="panel-sm" type="button" onClick={guardar} disabled={guardando}>
                {guardando && <Spinner size={14} />}
                Guardar logo
              </Button3D>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
