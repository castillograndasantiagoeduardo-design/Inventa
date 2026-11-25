'use client';

/**
 * SincronizadorAparienciaRuta.tsx — Garantiza que al navegar en cliente (SPA)
 * entre un panel operativo (/dashboard, /admin-sucursal, /vendedor-b2b, /pos)
 * y las vistas públicas/comerciales (/, /acceso, /registro, /cuenta, etc.),
 * la Landing y el login vuelvan inmediatamente a los colores estáticos de Inventa
 * sin perder las preferencias guardadas de la cuenta.
 */

import { useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { sincronizarAparienciaSegunRuta } from '@/lib/apariencia-ruta';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function SincronizadorAparienciaRuta() {
  const pathname = usePathname();

  useIsomorphicLayoutEffect(() => {
    sincronizarAparienciaSegunRuta(pathname);
  }, [pathname]);

  return null;
}
