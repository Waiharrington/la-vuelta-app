"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-dark px-6 pt-20 pb-24">
      <div className="w-full max-w-3xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 font-secondary text-sm text-wool/58 hover:text-cream"
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>

        <h1 className="display-title text-5xl text-cream sm:text-7xl mb-6">
          Términos de Servicio
        </h1>

        <div className="space-y-6">
          <section className="brand-panel p-5 sm:p-6">
            <p className="section-kicker mb-3">Última actualización</p>
            <p className="font-secondary text-sm text-wool/60">
              {new Date().toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </section>

          <section className="brand-panel p-5 sm:p-6">
            <p className="font-secondary text-sm leading-6 text-wool/60">
              Los términos de servicio de La Vuelta Running Club estarán
              disponibles próximamente. Mientras tanto, al usar la aplicación
              aceptas que se trata de una herramienta de tracking deportivo en
              fase de desarrollo.
            </p>
          </section>

          <section className="brand-panel p-5 sm:p-6">
            <p className="font-secondary text-sm leading-6 text-wool/60">
              La información proporcionada en esta aplicación tiene fines
              informativos y no constituye asesoramiento médico o deportivo
              profesional. Consultá a un profesional antes de iniciar cualquier
              rutina de ejercicios.
            </p>
          </section>

          <section className="brand-panel p-5 sm:p-6">
            <p className="section-kicker mb-3">Contacto</p>
            <p className="font-secondary text-sm text-wool/60">
              Para consultas sobre estos términos, comunicate con nosotros a
              través de la sección de soporte de la aplicación.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
