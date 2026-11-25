'use client';

/**
 * AdminProfileModal.tsx — Ficha y gestión de perfil del Administrador de Sucursal.
 * 
 * Principios SOLID y Seguridad (RBAC):
 * - Single Responsibility Principle (SRP): Permite al administrador consultar su
 *   identidad corporativa y actualizar sus propios datos de contacto (teléfono y dirección).
 * - Segregación de Funciones: Protege la integridad del sistema impidiendo la auto-desactivación,
 *   la modificación de sueldos o el cambio arbitrario de rol/sucursal (reservado para Superadmin).
 */

import React, { useState, useEffect } from 'react';
import { Button3D } from '@/components/ui/Button3D';
import { AvatarMarca } from '@/features/marca';
import { Insignia } from './Insignia';
import { ShieldIcon } from './Icons';
import type { EmpleadoSede } from '../types/branch-staff.types';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  perfil: EmpleadoSede | null;
  email?: string;
  rolNombre?: string;
  onGuardarContacto: (data: { telefono?: string; direccion?: string }) => Promise<{ ok: boolean; error?: string }>;
}

export function AdminProfileModal({
  isOpen,
  onClose,
  perfil,
  email = 'admin.norte@inventa.local',
  rolNombre = 'admin-sucursal',
  onGuardarContacto,
}: AdminProfileModalProps) {
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (perfil) {
      setTelefono(perfil.telefono || '');
      setDireccion(perfil.direccion || '');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [perfil, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await onGuardarContacto({
        telefono: telefono.trim(),
        direccion: direccion.trim(),
      });

      if (!res.ok) {
        setErrorMsg(res.error || 'No fue posible actualizar tus datos de contacto.');
        return;
      }

      setSuccessMsg('Datos de contacto actualizados correctamente.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al guardar los cambios.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inicial = perfil?.nombre ? perfil.nombre.charAt(0).toUpperCase() : 'A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg vidrio-popover text-text overflow-hidden">
        {/* 1. Cabecera con Avatar de Identidad / Logo de Empresa y Rol */}
        <div className="relative px-6 py-5 border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <AvatarMarca className="h-12 w-12 rounded-xl bg-brand-600 text-btn-primario-texto flex items-center justify-center font-titulos font-bold text-lg shadow-sm shrink-0">
                {inicial}
              </AvatarMarca>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold font-titulos text-text truncate">
                  {perfil?.nombre || 'Mi Perfil Administrativo'}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Insignia variante="brand" tamano="sm">
                    {rolNombre}
                  </Insignia>
                  <span className="text-xs text-text-muted truncate">
                    {perfil?.sucursalNombre || 'Sede Principal'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Cerrar modal"
              className="h-8 w-8 rounded-lg superficie-control text-text-muted hover:text-text transition-colors flex items-center justify-center cursor-pointer text-sm shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 2. Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/12 border border-red-500/30 text-red-600 dark:text-red-200 text-xs">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/12 border border-emerald-500/30 text-emerald-600 dark:text-emerald-200 text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {/* Bloque A: Datos Institucionales Inmutables (Segregación RBAC) */}
          <div className="p-3.5 rounded-xl superficie-control space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider">
                Credenciales del Sistema
              </span>
              <span className="flex items-center gap-1 text-[10px] text-brand-600 dark:text-brand-300 font-semibold">
                <ShieldIcon size={11} />
                Gestionado por Superadmin
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <span className="text-[10px] text-text-muted block font-mono">Documento</span>
                <span className="font-semibold text-text font-mono">
                  {perfil?.tipoDocumento} {perfil?.numeroDocumento}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block font-mono">Correo Corporativo</span>
                <span className="font-semibold text-text truncate block">
                  {email}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block font-mono">Cargo Laboral</span>
                <span className="font-semibold text-text">
                  {perfil?.cargo || 'Administrador de Sucursal'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block font-mono">Fecha de Ingreso</span>
                <span className="font-semibold text-text font-mono">
                  {perfil?.fechaIngreso || '2026-10-25'}
                </span>
              </div>
            </div>
          </div>

          {/* Bloque B: Datos de Contacto Personal Editables */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-semibold text-text uppercase tracking-wider">
              Información de Contacto Personal
            </h3>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej. +57 310 123 4567"
                className="panel-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Dirección de Residencia
              </label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Ej. Carrera 15 # 93-40, Apto 502"
                className="panel-input text-xs"
              />
            </div>
          </div>

          {/* Aviso de Seguridad Informativo */}
          <p className="text-[11px] text-text-muted leading-relaxed">
            * Para solicitar cambios de sede asignada, variación salarial o reasignación de credenciales, contacta a la mesa directiva a través del Super Administrador.
          </p>

          {/* 3. Acciones de Cierre y Guardado */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button3D
              type="button"
              size="panel-sm"
              variant="navy"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cerrar
            </Button3D>
            <Button3D
              type="submit"
              size="panel-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Contacto'}
            </Button3D>
          </div>
        </form>
      </div>
    </div>
  );
}
