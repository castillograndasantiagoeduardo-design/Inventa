'use client';

/**
 * Sidebar.tsx — Barra lateral flotante del panel del Super Admin (Glassmorphism Ejecutivo,
 * mismo estilo que /admin-sucursal): secciones, ítem activo, modo colapsado en escritorio
 * y cajón en móvil. Las entradas salen de menu.config.ts filtradas por permisos.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  Building2,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  ShieldCheck,
  UserCircle2,
  Users2,
  X,
} from 'lucide-react';
import { useAuth } from '@/features/autenticacion';
import { usePanelMenu } from './usePanelMenu';
import { PANEL_MENU_CATEGORIAS, type PanelMenuIcono, type PanelMenuItem } from './menu.config';
import { InventaLogo } from './InventaLogo';
import { InventaWordmark } from './InventaWordmark';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const ICONOS: Record<PanelMenuIcono, React.ReactNode> = {
  inicio: <LayoutDashboard className="w-4 h-4 shrink-0" />,
  sucursales: <Building2 className="w-4 h-4 shrink-0" />,
  usuarios: <ShieldCheck className="w-4 h-4 shrink-0" />,
  empleados: <Users2 className="w-4 h-4 shrink-0" />,
  auditoria: <ScrollText className="w-4 h-4 shrink-0" />,
  alertas: <AlertTriangle className="w-4 h-4 shrink-0" />,
  cuenta: <UserCircle2 className="w-4 h-4 shrink-0" />,
};

function esActivo(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

const BOTON_ICONO =
  'p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-slate-900/5 dark:hover:bg-white/8 transition-colors shrink-0 cursor-pointer';

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname() || '';
  const items = usePanelMenu();
  const { logout } = useAuth();
  const [colapsado, setColapsado] = useState(false);

  const renderItem = (item: PanelMenuItem, enCajon: boolean) => {
    const compacto = !enCajon && colapsado;
    const activo = esActivo(pathname, item.href);
    const forma = compacto
      ? 'p-2.5 justify-center w-11 h-11'
      : 'w-full px-3 py-2 text-left gap-3 text-xs font-sans font-medium';

    if (item.proximamente) {
      return (
        <span
          key={item.href}
          aria-disabled="true"
          title={compacto ? item.label : undefined}
          className={`flex items-center rounded-xl border border-transparent text-text-muted/60 cursor-not-allowed ${forma}`}
        >
          {ICONOS[item.icon]}
          {!compacto && (
            <>
              <span className="truncate">{item.label}</span>
              <span className="ml-auto rounded-full border border-border px-2 text-[10px] uppercase">Pronto</span>
            </>
          )}
        </span>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => enCajon && onClose()}
        aria-current={activo ? 'page' : undefined}
        title={compacto ? item.label : undefined}
        className={`flex items-center rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 ${forma} ${
          activo
            ? 'bg-brand-600/15 dark:bg-brand-500/18 border border-brand-600/30 dark:border-brand-400/40 text-brand-700 dark:text-slate-100 font-semibold shadow-sm'
            : 'border border-transparent text-text-muted font-normal hover:text-text hover:bg-slate-900/5 dark:hover:bg-white/6'
        }`}
      >
        <span className={activo ? 'text-brand-500' : 'text-text-muted'}>{ICONOS[item.icon]}</span>
        {!compacto && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  const contenido = (enCajon: boolean) => {
    const compacto = !enCajon && colapsado;
    return (
      <aside
        className={`vidrio-fuerte rounded-2xl flex flex-col justify-between transition-all duration-300 select-none overflow-hidden shrink-0 ${
          enCajon ? 'h-full w-64' : `h-[calc(100vh-2rem)] ${compacto ? 'w-20' : 'w-64'}`
        }`}
        aria-label="Navegación del panel"
      >
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <div className={`h-16 px-4 flex items-center border-b border-border shrink-0 ${compacto ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <span className="shrink-0" title="Inventa — Super Admin">
                <InventaLogo className="w-8 rounded-lg shadow-sm ring-1 ring-slate-900/10 dark:ring-white/20" />
              </span>
              {!compacto && (
                <div className="min-w-0">
                  <span className="block leading-tight">
                    <InventaWordmark className="text-base text-text" />
                  </span>
                  <span className="font-sans text-xs font-medium text-text-muted block leading-tight mt-0.5 whitespace-nowrap">
                    Super Admin
                  </span>
                </div>
              )}
            </div>
            {enCajon ? (
              <button type="button" onClick={onClose} className={`${BOTON_ICONO} ml-auto`} title="Cerrar menú" aria-label="Cerrar menú">
                <X className="w-4 h-4" />
              </button>
            ) : (
              !compacto && (
                <button
                  type="button"
                  onClick={() => setColapsado(true)}
                  className={`${BOTON_ICONO} ml-auto`}
                  title="Colapsar barra lateral"
                  aria-label="Colapsar barra lateral"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )
            )}
          </div>

          <nav className={`p-3 space-y-5 flex-1 ${compacto ? 'flex flex-col items-center' : ''}`} aria-label="Navegación principal">
            {PANEL_MENU_CATEGORIAS.map((categoria) => {
              const delGrupo = items.filter((it) => it.categoria === categoria);
              if (delGrupo.length === 0) return null;
              return (
                <div key={categoria} className={`space-y-1.5 ${compacto ? 'w-full flex flex-col items-center' : ''}`}>
                  {compacto ? (
                    <div className="w-6 h-px bg-border my-1" aria-hidden="true" />
                  ) : (
                    <p className="px-3 text-xs font-sans font-medium uppercase tracking-wide text-text-muted">{categoria}</p>
                  )}
                  <div className={`space-y-1 ${compacto ? 'w-full flex flex-col items-center' : ''}`}>
                    {delGrupo.map((item) => renderItem(item, enCajon))}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-border shrink-0 space-y-1">
          {compacto && (
            <button
              type="button"
              onClick={() => setColapsado(false)}
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-text-muted hover:text-text hover:bg-slate-900/5 dark:hover:bg-white/8 transition-colors cursor-pointer"
              title="Expandir barra lateral"
              aria-label="Expandir barra lateral"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => logout()}
            title={compacto ? 'Cerrar sesión' : undefined}
            className={`w-full flex items-center gap-3 rounded-xl text-xs font-sans font-medium text-text-muted hover:text-text hover:bg-slate-900/5 dark:hover:bg-white/6 transition-colors cursor-pointer ${
              compacto ? 'justify-center p-2.5' : 'px-3 py-2.5'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0 text-text-muted" />
            {!compacto && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>
    );
  };

  return (
    <>
      <div className="hidden md:block">{contenido(false)}</div>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden flex p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" aria-hidden="true" onClick={onClose} />
          <div className="relative z-10 h-full">{contenido(true)}</div>
        </div>
      )}
    </>
  );
}
