import {
  RangoExcedeMaximoError,
  RangoFechasInvalidoError,
} from '../errors/AdministracionErrors.ts';

export interface RangoBogotaProcesado {
  desde: Date;
  hasta: Date;
  desdeStr: string;
  hastaStr: string;
  dias: number;
  granularidad: 'hora' | 'dia' | 'semana';
  periodoAnterior: {
    desde: Date;
    hasta: Date;
    desdeStr: string;
    hastaStr: string;
  };
}

export class FechaBogotaUtils {
  private static readonly OFFSET_BOGOTA = '-05:00';
  private static readonly MAX_DIAS_PERMITIDOS = 366;

  /**
   * Procesa un rango de fechas en zona horaria America/Bogotá (UTC-5),
   * validando consistencia, máximo de días y calculando el período anterior equivalente.
   */
  public static procesarRango(desdeStr: string, hastaStr: string): RangoBogotaProcesado {
    const dStr = desdeStr.slice(0, 10);
    const hStr = hastaStr.slice(0, 10);

    const desde = new Date(`${dStr}T00:00:00.000${this.OFFSET_BOGOTA}`);
    const hasta = new Date(`${hStr}T23:59:59.999${this.OFFSET_BOGOTA}`);

    if (isNaN(desde.getTime()) || isNaN(hasta.getTime())) {
      throw new RangoFechasInvalidoError();
    }

    if (desde > hasta) {
      throw new RangoFechasInvalidoError();
    }

    // Cálculo de días calendario completos inclusivos
    const msPorDia = 24 * 60 * 60 * 1000;
    const dias = Math.round((hasta.getTime() - desde.getTime()) / msPorDia);

    if (dias > this.MAX_DIAS_PERMITIDOS) {
      throw new RangoExcedeMaximoError(this.MAX_DIAS_PERMITIDOS);
    }

    // Granularidad según requerimiento:
    // - 1 día: 'hora'
    // - <= 90 días: 'dia'
    // - > 90 días: 'semana'
    const granularidad: 'hora' | 'dia' | 'semana' =
      dias <= 1 ? 'hora' : dias <= 90 ? 'dia' : 'semana';

    // Período anterior de igual duración:
    // Desde anterior = (días) días antes de la fecha inicial
    // Hasta anterior = 1 día antes de la fecha inicial
    const fDesde = new Date(`${dStr}T12:00:00.000Z`);
    const fHastaAnterior = new Date(fDesde);
    fHastaAnterior.setUTCDate(fHastaAnterior.getUTCDate() - 1);

    const fDesdeAnterior = new Date(fDesde);
    fDesdeAnterior.setUTCDate(fDesdeAnterior.getUTCDate() - dias);

    const pad = (n: number) => String(n).padStart(2, '0');
    const toIsoDate = (d: Date) =>
      `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

    const desdeAnteriorStr = toIsoDate(fDesdeAnterior);
    const hastaAnteriorStr = toIsoDate(fHastaAnterior);

    const desdeAnterior = new Date(`${desdeAnteriorStr}T00:00:00.000${this.OFFSET_BOGOTA}`);
    const hastaAnterior = new Date(`${hastaAnteriorStr}T23:59:59.999${this.OFFSET_BOGOTA}`);

    return {
      desde,
      hasta,
      desdeStr: dStr,
      hastaStr: hStr,
      dias,
      granularidad,
      periodoAnterior: {
        desde: desdeAnterior,
        hasta: hastaAnterior,
        desdeStr: desdeAnteriorStr,
        hastaStr: hastaAnteriorStr,
      },
    };
  }

  /**
   * Formatea un período en etiqueta amigable en español.
   */
  public static formatearEtiquetaPeriodo(
    periodo: string,
    granularidad: 'hora' | 'dia' | 'semana',
  ): string {
    if (granularidad === 'hora') {
      const horaNum = parseInt(periodo.split(':')[0], 10);
      if (isNaN(horaNum)) return periodo;
      const ampm = horaNum >= 12 ? 'PM' : 'AM';
      const h12 = horaNum % 12 === 0 ? 12 : horaNum % 12;
      return `${h12} ${ampm}`;
    }

    if (granularidad === 'dia') {
      // YYYY-MM-DD
      const partes = periodo.split('-');
      if (partes.length === 3) {
        const dia = partes[2];
        const meses = [
          'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
          'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
        ];
        const mesIdx = parseInt(partes[1], 10) - 1;
        return `${dia} ${meses[mesIdx] ?? partes[1]}`;
      }
      return periodo;
    }

    if (granularidad === 'semana') {
      // YYYY-Www
      const partes = periodo.split('-W');
      if (partes.length === 2) {
        return `Sem ${partes[1]}`;
      }
      return periodo;
    }

    return periodo;
  }
}
