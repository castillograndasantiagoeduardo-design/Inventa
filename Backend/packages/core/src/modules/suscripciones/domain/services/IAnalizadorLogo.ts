/** Valida el logo de la empresa (solo PNG) y detecta su color principal. */
export type ResultadoAnalisisLogo =
  | { ok: true; colorPrincipal: string; ancho: number; alto: number }
  | { ok: false; error: string };

export interface IAnalizadorLogo {
  analizar(bytes: Uint8Array): ResultadoAnalisisLogo;
}

/** Marca de una empresa (o de la cuenta de su dueño antes de comprar). */
export interface MarcaEmpresa {
  colorPrincipal: string | null;
  /** Cambia cada vez que se sube un logo nuevo (sirve para invalidar la caché del navegador). */
  logoVersion: string | null;
}

/** Logo ya validado, listo para guardar. */
export interface LogoValidado {
  png: Uint8Array;
  version: string;
  colorPrincipal: string;
}
