/**
 * marca.store.ts — Marca de la empresa del usuario del panel: color principal y logo PNG.
 *
 * Se carga una sola vez por pestaña (caché a nivel de módulo) y la comparten el avatar,
 * la marca de agua, el selector de paletas y el POS. El logo se descarga con la sesión
 * (credentials: 'include') y se expone como URL de objeto.
 */

import { env } from '@/lib/config/env';
import { activarPaletaEmpresa, aplicarPaletaEmpresa, retirarPaletaEmpresa } from './paleta-empresa';
import { normalizarLogoBlob, type TonoLogo } from './normalizar-logo';

export interface EstadoMarca {
  colorPrincipal: string | null;
  logoUrl: string | null;
  proporcion: number;
  tonoLogo: TonoLogo;
  cargada: boolean;
}

const INICIAL: EstadoMarca = {
  colorPrincipal: null,
  logoUrl: null,
  proporcion: 1,
  tonoLogo: 'color',
  cargada: false,
};
let estado: EstadoMarca = INICIAL;
let carga: Promise<void> | null = null;
const oyentes = new Set<() => void>();

const base = () => env.apiUrl.replace(/\/+$/, '');

function publicar(nuevo: EstadoMarca) {
  if (estado.logoUrl && estado.logoUrl !== nuevo.logoUrl) URL.revokeObjectURL(estado.logoUrl);
  estado = nuevo;
  oyentes.forEach((o) => o());
}

async function cargar(): Promise<void> {
  try {
    const r = await fetch(`${base()}/empresa/marca`, { credentials: 'include' });
    if (!r.ok) return publicar({ ...INICIAL, cargada: true });
    const marca = (await r.json()) as { colorPrincipal: string | null; logoVersion: string | null };

    let logoUrl: string | null = null;
    let proporcion = 1;
    let tonoLogo: TonoLogo = 'color';
    if (marca.logoVersion) {
      const l = await fetch(`${base()}/empresa/logo?v=${encodeURIComponent(marca.logoVersion)}`, { credentials: 'include' });
      if (l.ok) {
        const normalizado = await normalizarLogoBlob(await l.blob());
        logoUrl = normalizado.url;
        proporcion = normalizado.proporcion;
        tonoLogo = normalizado.tonoLogo;
      }
    }
    if (marca.colorPrincipal) aplicarPaletaEmpresa(marca.colorPrincipal);
    else retirarPaletaEmpresa();
    publicar({ colorPrincipal: marca.colorPrincipal, logoUrl, proporcion, tonoLogo, cargada: true });
  } catch {
    publicar({ ...INICIAL, cargada: true });
  }
}

export const marcaStore = {
  obtener: () => estado,
  obtenerServidor: () => INICIAL,
  suscribir(oyente: () => void) {
    oyentes.add(oyente);
    carga ??= cargar();
    return () => oyentes.delete(oyente);
  },
  /** Olvida la marca y su paleta (al iniciar o cerrar sesión, o al cambiar el logo). */
  reiniciar() {
    carga = null;
    retirarPaletaEmpresa();
    publicar(INICIAL);
  },
  /** Recarga la marca desde el servidor y activa la paleta del nuevo color si aplica. */
  async recargar(): Promise<void> {
    carga = cargar();
    await carga;
  },
};

/** Actualiza el logo PNG de la empresa activa desde el panel (requiere permiso de gestión de sucursales). */
export async function actualizarLogoEmpresaPanel(
  logoPng: string,
): Promise<{ colorPrincipal: string; logoVersion: string }> {
  const r = await fetch(`${base()}/empresa/logo`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logoPng }),
  });
  if (!r.ok) {
    const cuerpo = (await r.json().catch(() => null)) as { message?: string } | null;
    throw new Error(cuerpo?.message || 'No se pudo actualizar el logo de la empresa.');
  }
  const marca = (await r.json()) as { colorPrincipal: string; logoVersion: string };
  activarPaletaEmpresa(marca.colorPrincipal);
  await marcaStore.recargar();
  return marca;
}
