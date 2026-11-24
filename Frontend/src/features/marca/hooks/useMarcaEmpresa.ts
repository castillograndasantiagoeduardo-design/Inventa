'use client';

import { useSyncExternalStore } from 'react';
import { marcaStore, type EstadoMarca } from '../lib/marca.store';

/** Color principal y logo de la empresa del usuario (null mientras carga o si no tiene). */
export function useMarcaEmpresa(): EstadoMarca {
  return useSyncExternalStore(marcaStore.suscribir, marcaStore.obtener, marcaStore.obtenerServidor);
}
