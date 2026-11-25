'use client';

/**
 * PosCatalogo.tsx — Catálogo interactivo de productos y búsqueda rápida para el POS.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { posService } from '../api';
import type { ProductoPos } from '../types/pos.types';

/** Intervalo de revalidación automática en segundo plano (25 segundos). */
const INTERVALO_POLLING_MS = 25_000;

interface PosCatalogoProps {
  onAgregarProducto: (producto: ProductoPos) => void;
  /** Invocado cuando se detecta que un producto fue inactivado (para retirarlo también del carrito si estaba allí). */
  onProductoInactivado?: (productoId: string, nombreProducto: string) => void;
  /** Invocado tras cada sincronización completa del catálogo con los IDs activos. */
  onCatalogoSincronizado?: (idsActivos: Set<string>) => void;
  inputBuscarRef?: React.RefObject<HTMLInputElement | null>;
  /** Sede de la sesión: el stock mostrado es el de esta sucursal. */
  sucursalId: number;
  /** Cambia tras cada venta para recargar las existencias. */
  versionStock?: number;
}

export function PosCatalogo({
  onAgregarProducto,
  onProductoInactivado,
  onCatalogoSincronizado,
  inputBuscarRef,
  sucursalId,
  versionStock = 0,
}: PosCatalogoProps) {
  const [query, setQuery] = useState<string>('');
  const [productos, setProductos] = useState<ProductoPos[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todas');
  const [verificandoId, setVerificandoId] = useState<string | null>(null);
  const [alertaInactivo, setAlertaInactivo] = useState<string | null>(null);

  const localInputRef = useRef<HTMLInputElement | null>(null);
  const searchRef = inputBuscarRef || localInputRef;
  const queryRef = useRef<string>(query);
  const onCatalogoSincronizadoRef = useRef(onCatalogoSincronizado);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    onCatalogoSincronizadoRef.current = onCatalogoSincronizado;
  }, [onCatalogoSincronizado]);

  // Auto-ocultar banner de producto inactivado tras 6 segundos
  useEffect(() => {
    if (!alertaInactivo) return;
    const t = setTimeout(() => setAlertaInactivo(null), 6000);
    return () => clearTimeout(t);
  }, [alertaInactivo]);

  const formatoCOP = (monto: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(monto);

  /**
   * Revalidación silenciosa en segundo plano:
   * - No muestra spinner de carga ni bloquea la cuadrícula.
   * - 100% tolerante a microcortes de Wi-Fi: si la red falla temporalmente, conserva los productos actuales.
   */
  const revalidarEnSegundoPlano = useCallback(async () => {
    try {
      const terminoActual = queryRef.current;
      const data = await posService.buscarProductos(terminoActual, sucursalId);
      setProductos(data);
      setErrorCarga(null);
      if (!terminoActual.trim() && onCatalogoSincronizadoRef.current) {
        onCatalogoSincronizadoRef.current(new Set(data.map((p) => p.id)));
      }
    } catch {
      // Tolerancia a microcortes: mantenemos el catálogo en memoria sin interrumpir al cajero
    }
  }, [sucursalId]);

  // 1. Carga inicial y búsqueda con debounce
  useEffect(() => {
    let cancelado = false;
    const timer = setTimeout(async () => {
      setIsLoading((prev) => (productos.length === 0 ? true : prev));
      setErrorCarga(null);
      try {
        const data = await posService.buscarProductos(query, sucursalId);
        if (!cancelado) {
          setProductos(data);
          if (!query.trim() && onCatalogoSincronizadoRef.current) {
            onCatalogoSincronizadoRef.current(new Set(data.map((p) => p.id)));
          }
        }
      } catch (err: unknown) {
        if (!cancelado && productos.length === 0) {
          setProductos([]);
          setErrorCarga(err instanceof Error ? err.message : 'No se pudo consultar el catálogo.');
        }
      } finally {
        if (!cancelado) setIsLoading(false);
      }
    }, 220);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [query, sucursalId, versionStock]);

  // 2. Polling automático cada 25 segundos en segundo plano
  useEffect(() => {
    const intervalo = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      void revalidarEnSegundoPlano();
    }, INTERVALO_POLLING_MS);

    return () => clearInterval(intervalo);
  }, [revalidarEnSegundoPlano]);

  // 3. Revalidación al enfocar la ventana / volver a la pestaña + sincronización entre pestañas
  useEffect(() => {
    const handleFocus = () => {
      void revalidarEnSegundoPlano();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void revalidarEnSegundoPlano();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('warengine:catalogo-sync');
        bc.onmessage = () => {
          void revalidarEnSegundoPlano();
        };
      } catch {
        bc = null;
      }
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (bc) bc.close();
    };
  }, [revalidarEnSegundoPlano]);

  /**
   * 4. Verificación inmediata (Just-in-Time) al hacer clic o escanear un producto:
   * Comprueba que el producto siga activo antes de agregarlo al carrito.
   * Si fue inactivado, lo retira inmediatamente del catálogo (y del carrito) y avisa al cajero.
   */
  const handleSeleccionarProducto = useCallback(
    async (prod: ProductoPos) => {
      if (prod.stockActual <= 0 || verificandoId === prod.id) return;

      setVerificandoId(prod.id);
      try {
        const verificacion = await posService.verificarProductoActivo(prod.id);
        if (!verificacion.activo) {
          setProductos((prev) => prev.filter((p) => p.id !== prod.id));
          onProductoInactivado?.(prod.id, prod.nombre);
          setAlertaInactivo(
            `El producto "${prod.nombre}" (${prod.sku}) fue inactivado en inventario y ya no está disponible para la venta.`,
          );
          void revalidarEnSegundoPlano();
          return;
        }

        setAlertaInactivo(null);
        onAgregarProducto(
          verificacion.precioVenta !== undefined && verificacion.precioVenta > 0
            ? { ...prod, precioVenta: verificacion.precioVenta }
            : prod,
        );
      } finally {
        setVerificandoId(null);
      }
    },
    [verificandoId, onAgregarProducto, onProductoInactivado, revalidarEnSegundoPlano],
  );

  // Lista de categorías únicas extraídas de los productos
  const categorias = React.useMemo(() => {
    const cats = new Set<string>();
    productos.forEach((p) => {
      if (p.categoriaNombre) cats.add(p.categoriaNombre);
    });
    return Array.from(cats).sort((a, b) => a.localeCompare(b));
  }, [productos]);

  const tieneSinCategoria = React.useMemo(() => {
    return productos.some((p) => !p.categoriaNombre);
  }, [productos]);

  // Filtrado por categoría
  const productosFiltrados = React.useMemo(() => {
    if (categoriaSeleccionada === 'todas') return productos;
    if (categoriaSeleccionada === 'sin-categoria') {
      return productos.filter((p) => !p.categoriaNombre);
    }
    return productos.filter((p) => p.categoriaNombre === categoriaSeleccionada);
  }, [productos, categoriaSeleccionada]);

  // Manejo de lector de código de barras o Enter en el buscador
  const handleKeyDownBusqueda = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const limpio = query.trim().toLowerCase();
      if (!limpio) return;

      // Buscar coincidencia exacta por SKU primero (código de barras)
      const coincidenciaSku = productos.find(
        (p) => p.sku.toLowerCase() === limpio,
      );
      if (coincidenciaSku && coincidenciaSku.stockActual > 0) {
        void handleSeleccionarProducto(coincidenciaSku);
        setQuery('');
        return;
      }

      // O si hay solo 1 resultado visible, añadirlo
      if (productosFiltrados.length === 1 && productosFiltrados[0].stockActual > 0) {
        void handleSeleccionarProducto(productosFiltrados[0]);
        setQuery('');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4">
      {/* Banner de aviso si el cajero seleccionó un producto que acaba de ser inactivado */}
      {alertaInactivo && (
        <div
          role="alert"
          className="mb-3 px-4 py-2.5 rounded-xl bg-red-500/12 border border-red-500/35 text-red-700 dark:text-rose-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150"
        >
          <span>⚠️ {alertaInactivo}</span>
          <button
            type="button"
            onClick={() => setAlertaInactivo(null)}
            className="text-red-700/70 hover:text-red-900 dark:text-rose-200/70 dark:hover:text-white font-bold cursor-pointer"
            aria-label="Cerrar alerta"
          >
            &times;
          </button>
        </div>
      )}
      {/* Barra de Búsqueda y Filtro de Categorías */}
      <div className="mb-3 space-y-2">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">
            🔍
          </span>
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownBusqueda}
            placeholder="Buscar por nombre o escanear código de barras / SKU (F2)..."
            className="panel-input pl-10 pr-16 py-2.5 text-sm"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded superficie-control text-[10px] text-text-muted font-mono">
            F2
          </span>
        </div>

        {/* Chips de categorías */}
        {categorias.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setCategoriaSeleccionada('todas')}
              className={`px-3 py-1 rounded-lg text-xs font-medium uppercase whitespace-nowrap cursor-pointer transition-all ${
                categoriaSeleccionada === 'todas'
                  ? 'bg-brand-600 text-btn-primario-texto font-semibold shadow-sm'
                  : 'superficie-control text-text-muted hover:text-text'
              }`}
            >
              Todos ({productos.length})
            </button>
            {categorias.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategoriaSeleccionada(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium uppercase whitespace-nowrap cursor-pointer transition-all ${
                  categoriaSeleccionada === cat
                    ? 'bg-brand-600 text-btn-primario-texto font-semibold shadow-sm'
                    : 'superficie-control text-text-muted hover:text-text'
                }`}
              >
                {cat}
              </button>
            ))}
            {tieneSinCategoria && (
              <button
                type="button"
                onClick={() => setCategoriaSeleccionada('sin-categoria')}
                className={`px-3 py-1 rounded-lg text-xs font-medium uppercase whitespace-nowrap cursor-pointer transition-all ${
                  categoriaSeleccionada === 'sin-categoria'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'superficie-control text-amber-600 dark:text-amber-300 border-amber-500/25'
                }`}
              >
                Sin Categoría
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid de productos */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Consultando catálogo...</span>
          </div>
        ) : errorCarga ? (
          <div className="h-64 vidrio flex flex-col items-center justify-center text-red-600 dark:text-rose-200 border-red-500/30 p-6 text-center">
            <p className="text-sm font-medium">No se pudo cargar el catálogo</p>
            <p className="text-xs opacity-80 mt-1">{errorCarga}</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="h-64 vidrio flex flex-col items-center justify-center text-text-muted p-6 text-center">
            <span className="text-3xl mb-2">📦</span>
            <p className="text-sm font-medium text-text">No se encontraron productos</p>
            <p className="text-xs text-text-muted mt-1">Intenta con otro término de búsqueda o SKU.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {productosFiltrados.map((prod) => {
              const agotado = prod.stockActual <= 0;
              const estaVerificando = verificandoId === prod.id;
              return (
                <div
                  key={prod.id}
                  onClick={() => !agotado && !estaVerificando && void handleSeleccionarProducto(prod)}
                  aria-disabled={agotado || estaVerificando}
                  title={agotado ? 'Sin existencias en esta sede' : undefined}
                  className={`group vidrio p-3 flex flex-col justify-between select-none ${
                    agotado
                      ? 'opacity-45 cursor-not-allowed hover:translate-y-0'
                      : estaVerificando
                        ? 'opacity-75 cursor-wait hover:translate-y-0'
                        : 'hover:border-brand-500/50 cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded superficie-control text-text-muted tracking-wider">
                        {prod.sku}
                      </span>
                      {prod.categoriaNombre && (
                        <span className="text-[10px] font-medium text-brand-600 dark:text-brand-300 truncate max-w-[90px]">
                          {prod.categoriaNombre}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-text group-hover:text-brand-600 dark:group-hover:text-brand-300 line-clamp-2 leading-snug transition-colors">
                      {prod.nombre}
                    </h4>
                    <span className={`mt-1 block text-[10px] tabular-nums ${agotado ? 'text-red-600 dark:text-rose-300 font-medium' : 'text-text-muted'}`}>
                      {agotado ? 'Agotado en esta sede' : `Stock: ${prod.stockActual}`}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-border flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-text-muted block leading-none">Precio</span>
                      <span className="font-titulos font-bold text-brand-600 dark:text-brand-300 text-base tabular-nums">
                        {formatoCOP(prod.precioVenta)}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={agotado}
                      className="w-7 h-7 rounded-xl bg-brand-500/15 group-hover:bg-brand-600 text-brand-600 dark:text-brand-300 group-hover:text-btn-primario-texto flex items-center justify-center font-bold text-sm transition-colors shadow-xs"
                      title="Añadir al carrito"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
