import type { Metadata, Viewport } from "next";
import {
  Anton,
  Archivo,
  Bodoni_Moda,
  Outfit,
  Plus_Jakarta_Sans,
  Inter,
  IBM_Plex_Mono,
} from "next/font/google";
import { AuthProvider } from "@/features/autenticacion";
import "./globals.css";

// Títulos, encabezados y cifras KPI: Plus Jakarta Sans
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

// Texto general / UI: Inter
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

// Códigos, SKUs y consecutivos: IBM Plex Mono
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const archivo = Archivo({
  weight: ["900"],
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

// Fuente base de toda la interfaz (sans geométrica), login incluido.
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

const bodoni = Bodoni_Moda({
  weight: ["400", "700"],
  style: ["italic"],
  subsets: ["latin"],
  variable: "--font-bodoni",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inventa — Administración, Ventas & Logística a otro nivel",
  description:
    "Sistema ERP / POS multi-sucursal para cadenas comerciales, inventario multi-almacén y facturación electrónica.",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

// Las claves de localStorage van en literal porque este script inline no puede
// importar módulos. Fuente de verdad: src/lib/storage-keys.ts (STORAGE_KEYS y
// LEGACY_STORAGE_KEYS); si cambias una allí, cámbiala también aquí.
const scriptInicializacionTema = `
(function() {
  // Migración del rebrand Warengine → Inventa: va antes de las lecturas para evitar parpadeo.
  try {
    var claves = ['tema', 'paleta', 'fondo', 'paleta-custom', 'paleta-custom-vars'];
    for (var i = 0; i < claves.length; i++) {
      var vieja = 'warengine-' + claves[i];
      var nueva = 'inventa-' + claves[i];
      var valor = localStorage.getItem(vieja);
      if (valor !== null && localStorage.getItem(nueva) === null) {
        localStorage.setItem(nueva, valor);
      }
      if (valor !== null) localStorage.removeItem(vieja);
    }
  } catch (e) {}
  try {
    var d = document.documentElement;
    var paleta = localStorage.getItem('inventa-paleta') || 'zafiro';
    var fondo = localStorage.getItem('inventa-fondo') || 'malla';
    var tema = localStorage.getItem('inventa-tema') || 'dark';
    var transpRaw = localStorage.getItem('inventa-transparencia-cards');
    if (transpRaw !== null) {
      var transp = Math.max(0, Math.min(95, Number(transpRaw)));
      if (!isNaN(transp)) {
        d.style.setProperty('--card-opacidad', (100 - transp) + '%');
      }
    }
    d.setAttribute('data-paleta', paleta);
    d.setAttribute('data-fondo', fondo);
    if (paleta === 'personalizada' || paleta === 'empresa') {
      // 'empresa' = paleta generada del color del logo de la empresa (MarcaEmpresaProvider).
      var varsRaw = localStorage.getItem(paleta === 'empresa' ? 'inventa-paleta-empresa-vars' : 'inventa-paleta-custom-vars');
      if (varsRaw) {
        var varsObj = JSON.parse(varsRaw);
        for (var k in varsObj) {
          if (Object.prototype.hasOwnProperty.call(varsObj, k)) {
            d.style.setProperty(k, varsObj[k]);
          }
        }
      }
    }
    if (tema === 'light') {
      d.classList.add('light');
      d.classList.remove('dark');
    } else {
      d.classList.add('dark');
      d.classList.remove('light');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      data-paleta="zafiro"
      data-fondo="malla"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${inter.variable} ${ibmPlexMono.variable} ${anton.variable} ${archivo.variable} ${outfit.variable} ${bodoni.variable} dark h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptInicializacionTema }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text font-sans overflow-x-hidden selection:bg-brand-500 selection:text-btn-primario-texto">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

