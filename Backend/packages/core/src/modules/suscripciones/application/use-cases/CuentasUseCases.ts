/**
 * Casos de uso de cuentas de la web: registro gratuito, sesión, "Mi cuenta" y catálogo de planes.
 */

import { DomainError, Result } from '@inventa/shared-kernel';
import type { IPasswordService } from '../../../autenticacion/domain/services/IPasswordService.ts';
import { CredencialesInvalidasError } from '../../../autenticacion/domain/errors/AutenticacionErrors.ts';
import type { Cuenta, Plan } from '../../domain/entities/Suscripciones.ts';
import { CorreoYaRegistradoError, CuentaNoEncontradaError, LogoInvalidoError } from '../../domain/errors/SuscripcionesErrors.ts';
import type {
  ICuentaRepository,
  IMarcaEmpresaRepository,
  IPlanRepository,
  ISuscripcionRepository,
} from '../../domain/repositories/ISuscripcionesPuertos.ts';
import type { ITokenCuentaService } from '../../domain/services/ITokenCuentaService.ts';
import type { IAnalizadorLogo, LogoValidado, MarcaEmpresa } from '../../domain/services/IAnalizadorLogo.ts';

/** Valida el PNG y arma el logo a guardar (con su color principal y una versión nueva). */
function validarLogo(analizador: IAnalizadorLogo, png: Uint8Array): Result<LogoValidado, DomainError> {
  const analisis = analizador.analizar(png);
  if (!analisis.ok) return Result.fail(new LogoInvalidoError(analisis.error));
  return Result.ok({ png, colorPrincipal: analisis.colorPrincipal, version: crypto.randomUUID().replace(/-/g, '').slice(0, 16) });
}

export type CuentaPublica = Omit<Cuenta, 'passwordHash'>;

const sinHash = ({ passwordHash: _omitido, ...resto }: Cuenta): CuentaPublica => resto;

/** Crea una cuenta gratuita (sin empresa) con el logo de su empresa y abre su sesión. */
export class RegistrarCuentaUseCase {
  constructor(
    private readonly cuentas: ICuentaRepository,
    private readonly passwords: IPasswordService,
    private readonly tokens: ITokenCuentaService,
    private readonly analizador: IAnalizadorLogo,
  ) {}

  async execute(datos: { nombre: string; email: string; password: string; logoPng: Uint8Array }): Promise<Result<{ cuenta: CuentaPublica; token: string }, DomainError>> {
    const email = datos.email.trim().toLowerCase();
    const logo = validarLogo(this.analizador, datos.logoPng);
    if (logo.isFailure) return Result.fail(logo.error);
    if (await this.cuentas.correoOcupado(email)) return Result.fail(new CorreoYaRegistradoError());

    const cuenta = await this.cuentas.crear({
      email,
      nombre: datos.nombre.trim(),
      passwordHash: await this.passwords.hashear(datos.password),
      logo: logo.value,
    });
    return Result.ok({ cuenta: sinHash(cuenta), token: await this.tokens.generar(cuenta.id) });
  }
}

/** Inicia la sesión de una cuenta de la web con correo y contraseña. */
export class IniciarSesionCuentaUseCase {
  constructor(
    private readonly cuentas: ICuentaRepository,
    private readonly passwords: IPasswordService,
    private readonly tokens: ITokenCuentaService,
  ) {}

  async execute(datos: { email: string; password: string }): Promise<Result<{ cuenta: CuentaPublica; token: string }, DomainError>> {
    const cuenta = await this.cuentas.buscarPorEmail(datos.email.trim().toLowerCase());
    // Mismo error para correo inexistente o clave incorrecta (no revela si el correo existe).
    if (!cuenta || !(await this.passwords.comparar(datos.password, cuenta.passwordHash))) {
      return Result.fail(new CredencialesInvalidasError());
    }
    return Result.ok({ cuenta: sinHash(cuenta), token: await this.tokens.generar(cuenta.id) });
  }
}

export interface MiCuenta {
  cuenta: CuentaPublica;
  suscripcion: { planId: string; planNombre: string; venceEn: Date; vigente: boolean } | null;
}

/** Datos de la cuenta y su plan vigente (si ya compró). */
export class ObtenerMiCuentaUseCase {
  constructor(
    private readonly cuentas: ICuentaRepository,
    private readonly suscripciones: ISuscripcionRepository,
    private readonly planes: IPlanRepository,
  ) {}

  async execute(cuentaId: string): Promise<Result<MiCuenta, DomainError>> {
    const cuenta = await this.cuentas.buscarPorId(cuentaId);
    if (!cuenta) return Result.fail(new CuentaNoEncontradaError());

    let suscripcion: MiCuenta['suscripcion'] = null;
    if (cuenta.empresaId !== null) {
      const vigente = await this.suscripciones.vigenteDeEmpresa(cuenta.empresaId);
      if (vigente) {
        const plan = await this.planes.buscar(vigente.planId);
        suscripcion = { planId: vigente.planId, planNombre: plan?.nombre ?? vigente.planId, venceEn: vigente.venceEn, vigente: true };
      }
    }
    return Result.ok({ cuenta: sinHash(cuenta), suscripcion });
  }
}

/** Catálogo público de planes activos, ordenados. */
export class ListarPlanesUseCase {
  constructor(private readonly planes: IPlanRepository) {}

  async execute(): Promise<Result<Plan[], DomainError>> {
    return Result.ok(await this.planes.listarActivos());
  }
}

/** Cambia el logo de la cuenta (y de su empresa, si ya la tiene). Devuelve el color detectado. */
export class ActualizarLogoCuentaUseCase {
  constructor(
    private readonly cuentas: ICuentaRepository,
    private readonly analizador: IAnalizadorLogo,
  ) {}

  async execute(datos: { cuentaId: string; logoPng: Uint8Array }): Promise<Result<MarcaEmpresa, DomainError>> {
    const cuenta = await this.cuentas.buscarPorId(datos.cuentaId);
    if (!cuenta) return Result.fail(new CuentaNoEncontradaError());
    const logo = validarLogo(this.analizador, datos.logoPng);
    if (logo.isFailure) return Result.fail(logo.error);
    await this.cuentas.actualizarLogo(cuenta.id, logo.value);
    return Result.ok({ colorPrincipal: logo.value.colorPrincipal, logoVersion: logo.value.version });
  }
}

/** Marca de la empresa del usuario (color y versión del logo) para pintar su panel. */
export class ObtenerMarcaEmpresaUseCase {
  constructor(private readonly marcas: IMarcaEmpresaRepository) {}

  async execute(empresaId: number): Promise<Result<MarcaEmpresa, DomainError>> {
    return Result.ok((await this.marcas.obtener(empresaId)) ?? { colorPrincipal: null, logoVersion: null });
  }
}
