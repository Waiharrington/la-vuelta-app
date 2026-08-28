"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          Política de Privacidad
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
            <p className="section-kicker mb-3">Datos que recopilamos</p>
            <p className="font-secondary text-sm leading-6 text-wool/60">
              La Vuelta Running Club recopila información que vos proporcionás
              directamente (nombre, email, perfil) y datos de actividad generados
              durante el uso de la app (rutas, distancia, tiempo). No compartimos
              tu información personal con terceros sin tu consentimiento.
            </p>
          </section>

          <section className="brand-panel p-5 sm:p-6">
            <p className="section-kicker mb-3">Uso de la información</p>
            <p className="font-secondary text-sm leading-6 text-wool/60">
              Utilizamos tus datos para proveer y mejorar los servicios de la
              aplicación, mostrar tus actividades y rutas, y facilitar la
              interacción con otros miembros del club. Tus datos no son vendidos
              ni utilizados con fines publicitarios.
            </p>
          </section>

          <section className="brand-panel p-5 sm:p-6">
            <p className="section-kicker mb-3">Tus derechos</p>
            <p className="font-secondary text-sm leading-6 text-wool/60">
              Podés solicitar acceso, corrección o eliminación de tus datos
              personales en cualquier momento. Contactanos a través de la
              sección de soporte para ejercer estos derechos.
            </p>
          </section>

          <section className="brand-panel p-5 sm:p-6">
            <p className="section-kicker mb-3">Contacto</p>
            <p className="font-secondary text-sm text-wool/60">
              Para consultas sobre esta política de privacidad, comunicate con
              nosotros a través de la sección de soporte de la aplicación.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
