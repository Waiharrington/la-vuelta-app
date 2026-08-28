"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dark px-6 text-center">
      <h1 className="display-title text-7xl text-cream">404</h1>

      <p className="section-kicker mt-6">Página no encontrada</p>

      <p className="mt-3 max-w-sm font-secondary text-sm text-wool/60">
        Esta ruta no existe en La Vuelta. Volvé al feed o grabá una actividad.
      </p>

      <Link href="/" className="brand-button mt-8">
        Volver al inicio
      </Link>
    </div>
  );
}
