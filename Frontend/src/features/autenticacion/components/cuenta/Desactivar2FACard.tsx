'use client';

/**
 * Desactivar2FACard.tsx — Desactivar el 2FA confirmando la contraseña actual.
 */

import { Button3D } from '@/components/ui/Button3D';
import { TextField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useDesactivar2FA } from '../../hooks/useDosFactores';

export function Desactivar2FACard() {
  const { valores, errores, errorGeneral, enviando, setCampo, enviar } = useDesactivar2FA();

  return (
    <section className="panel-card p-5 sm:p-6" aria-labelledby="titulo-desactivar-2fa">
      <h2 id="titulo-desactivar-2fa" className="font-titulos font-semibold tracking-[-0.005em] text-lg text-text">
        Desactivar verificación en dos pasos
      </h2>
      <p className="mt-1 text-sm text-text-muted">Tu cuenta quedará protegida solo con la contraseña. Confirma con tu contraseña actual.</p>
      <form onSubmit={enviar} noValidate className="mt-4 flex flex-col gap-4 sm:max-w-sm">
        {errorGeneral && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{errorGeneral}</p>}
        <TextField
          label="Contraseña actual"
          required
          type="password"
          autoComplete="current-password"
          value={valores.password}
          onChange={(e) => setCampo('password', e.target.value)}
          error={errores.password}
        />
        <div>
          <Button3D size="panel" variant="danger" type="submit" disabled={enviando}>
            {enviando && <Spinner size={16} />}
            Desactivar 2FA
          </Button3D>
        </div>
      </form>
    </section>
  );
}
