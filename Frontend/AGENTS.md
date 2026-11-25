<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Directrices de Desarrollo y Estándares Frontend Inventa

## Módulo Vendedor B2B (`src/features/vendedor-b2b`)

El módulo del Vendedor B2B (`/vendedor-b2b`) se rige bajo el estándar visual de **Glassmorphism Ejecutivo** (Zafiro: Negro `#070d1a`, Azul `#3b6cf2` y Blanco `#f1f5f9`), consistente con `/admin-sucursal`:

### Componentes Transversales Reutilizados
- Reexportados desde `@/components/`:
  - `Tarjeta`: Tarjeta de cristal `.vidrio` con elevación hover.
  - `Insignia`: Badges semánticos de estado (success, warning, danger, info, neutral, brand) con ring y puntos.
  - `FondoAmbiental`: Capa de orbes de luz ambiental difusa, retícula `.trama-malla` y textura de ruido.
  - `SelectorPaleta`: Panel flotante `.vidrio-popover` para personalización de paleta y fondo.

### Componentes del Módulo (`src/features/vendedor-b2b/components/`)
- `VendedorB2BLayout.tsx`: Contenedor maestro con fondo ambiental, sidebar flotante sticky, header y área de contenido responsiva.
- `VendedorB2BSidebar.tsx`: Barra lateral con soporte para colapso en dock (`w-20` / `w-64`), drawer móvil y navegación configurada en `vendedor-b2b.navigation.config.ts`.
- `VendedorB2BHeader.tsx`: Barra superior flotante `.vidrio-fuerte` con selector de paletas, alternador oscuro/claro y cápsula de perfil.
- `CatalogoMultiBodega.tsx`: Catálogo en cuadrícula responsive, filtros en `superficie-control`, badges de stock e insignias semánticas.
- `CotizacionPanel.tsx`: Panel de cotización con selector de cliente corporativo, insignias de estado de crédito y desglose de totales en `tabular-nums`.
- `ModalVidrio.tsx`: Diálogo modal accesible renderizado en Portal con superficie `.vidrio-popover`, tecla Escape y bloqueo de scroll.
- Modales del módulo: `MisCotizacionesB2BModal`, `HistorialVentasB2BModal`, `ComprobanteB2BModal` y `NuevoClienteB2BModal`.

### Vendedor B2B — Mis empresas y Cartera B2B
- **Rutas:** `/vendedor-b2b/empresas` (listado, KPIs, cartera y mora) y `/vendedor-b2b/empresas/[id]` (detalle financiero, rentabilidad frente al cupo, obligaciones, abonos y avisos de pago).
- **Servicio y hooks:** `carteras.service.ts` (`ICarterasService`), `useEmpresasB2B`, `useCarteraB2B` y `useEmpresaB2BDetalle`.
- **Componentes en `src/features/vendedor-b2b/components/`:**
  - `CarteraKPIs.tsx`: tarjetas `.vidrio` de empresas B2B, cupo disponible, saldo/mora y ganancia generada.
  - `EmpresaB2BTabla.tsx`: listado filtrable por búsqueda, estado de crédito, mora y cartera activa, con botón **"Soltar crédito"** y enlace al detalle.
  - `EmpresaB2BDetalle.tsx` y `EmpresaB2BHistorial.tsx`: ficha completa con cupos, ganancia vs. crédito otorgado, créditos vigentes/pagados/en mora, abonos confirmados y avisos reportados.
  - `CarteraPanel.tsx`: tabla paginada de obligaciones de crédito con antigüedad ("tiempo pagando") y botón **"Avisar pago"**.
  - `MoraPanel.tsx`: empresas con obligaciones vencidas ordenadas por mayor atraso.
  - `SoltarCreditoModal.tsx`: carga de ganancia neta mensual, antigüedad y plazo con simulación previa (`EvaluadorCreditoB2B`) y envío a `pendiente_aprobacion`.
  - `AvisarPagoModal.tsx`: reporte de transferencia/recibo (`facturacion:avisar-pago-credito`) sin modificar saldos directamente.
- **Separación de funciones en `/admin-sucursal/clientes`:** `AvisosPagoTab.tsx` (bandeja para confirmar o rechazar avisos) y `AbonoCreditoDirectoModal.tsx` (abono directo administrativo con `facturacion:registrar-abono-credito`).

### Reglas de Diseño Obligatorias
- Cero colores hexadecimales sueltos: usar siempre tokens de Tailwind (`bg-bg`, `text-text`, `text-text-muted`, `border-border`, etc.).
- Tipografía: títulos en `font-titulos`, cuerpo en `font-sans`, códigos/SKU/consecutivos en `font-mono`. Pesos limitados a `font-normal`, `font-medium` y `font-semibold` (prohibido `font-bold`).
- Cifras monetarias y cantidades formateadas en `es-CO` con `tabular-nums`.
- Sin scroll horizontal en resoluciones de 1280px y 1440px.

