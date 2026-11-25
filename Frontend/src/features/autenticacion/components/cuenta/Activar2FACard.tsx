'use client';

/**
 * Activar2FACard.tsx — Configurar el 2FA: QR + secreto y confirmación con código de 6 dígitos.
 */

import { Button3D } from '@/components/ui/Button3D';
import { TextField } from '@/components/ui/FormField';
import { QrCode } from '@/components/ui/QrCode';
import { Spinner } from '@/components/ui/Spinner';
import { useActivar2FA } from '../../hooks/useDosFactores';

export function Activar2FACard() {
  const { config, generando, activado, generar, cancelar, form } = useActivar2FA();
  const { valores, errores, errorGeneral, enviando, setCampo, handleSubmit } = form;

  return (
    <section className="panel-card p-5 sm:p-6" aria-labelledby="titulo-activar-2fa">
      <h2 id="titulo-activar-2fa" className="font-titulos font-semibold tracking-[-0.005em] text-lg text-text">
        Verificación en dos pasos
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        Protege tu cuenta con un código temporal de Google Authenticator, Microsoft Authenticator o similar. Si ya la tenías activa,
        configurarla de nuevo reemplaza el secreto anterior.
      </p>

      {activado && !config && (
        <p role="status" className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-700 dark:text-emerald-200">
          ✔ Activada. En tu próximo inicio de sesión se pedirá el código de 6 dígitos.
        </p>
      )}

      {!config ? (
        <div className="mt-4">
          <Button3D size="panel" type="button" onClick={generar} disabled={generando}>
            {generando && <Spinner size={16} />}
            {activado ? 'Volver a configurar' : 'Configurar 2FA'}
          </Button3D>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-2">
            <QrCode value={config.otpauthUrl} size={200} ariaLabel="Código QR para configurar la app de autenticación" />
            <a href={config.otpauthUrl} className="inline-flex min-h-[44px] items-center text-xs text-brand-600 dark:text-brand-300 underline">
              Abrir en la app (móvil)
            </a>
          </div>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <ol className="list-decimal pl-5 text-sm text-text space-y-1">
              <li>Escanea el QR con tu app de autenticación.</li>
              <li>Si no puedes escanear, ingresa este secreto manualmente:</li>
            </ol>
            <code className="break-all rounded-xl superficie-control px-3 py-2 text-sm font-mono tracking-widest text-brand-600 dark:text-brand-300 select-all">
              {config.secretBase32}
            </code>
            {errorGeneral && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{errorGeneral}</p>}
            <TextField
              label="Código de 6 dígitos"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={valores.codigoTotp}
              onChange={(e) => setCampo('codigoTotp', e.target.value.replace(/\D/g, ''))}
              error={errores.codigoTotp ?? errores.secretBase32}
            />
            <div className="flex flex-wrap gap-3">
              <Button3D size="panel" variant="navy" type="button" onClick={cancelar} disabled={enviando}>
                Cancelar
              </Button3D>
              <Button3D size="panel" variant="success" type="submit" disabled={enviando}>
                {enviando && <Spinner size={16} />}
                Activar
              </Button3D>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
