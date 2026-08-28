"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-dark px-5 py-8 text-cream">
      <Image
        src="/brand/origen-bg-desktop.png"
        alt="Comunidad La Vuelta Running Club"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-fire/88 via-dark/70 to-dark" />

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section className="hidden lg:block">
          <p className="section-kicker mb-4">Vuelve al pelotón</p>
          <h1 className="display-title max-w-2xl text-8xl">
            No te preocupes.
          </h1>
          <p className="mt-6 max-w-lg font-secondary text-lg leading-8 text-wool/76">
            Te enviaremos un enlace para restablecer tu contraseña y volver a correr.
          </p>
        </section>

        <section className="brand-panel w-full p-5 sm:p-7">
          <div className="mb-8 text-center">
            <div className="relative mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border border-caramel/45 bg-dark">
              <Image
                src="/brand/logo-round.png"
                alt="Logo La Vuelta"
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <h1 className="display-title text-4xl">LA VUELTA</h1>
            <p className="font-secondary text-xs font-bold uppercase tracking-[0.24em] text-caramel">
              Recuperar contraseña
            </p>
          </div>

          {sent ? (
            <div className="space-y-6 text-center">
              <div className="border border-caramel/40 bg-wine/25 p-5 font-secondary text-sm text-cream">
                <p className="mb-2 font-bold">Revisa tu correo</p>
                <p className="text-wool/76">
                  Te hemos enviado un enlace a <strong>{email}</strong> para restablecer tu contraseña.
                </p>
              </div>
              <Link
                href="/login"
                className="brand-button inline-block w-full text-center"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="font-secondary text-sm text-wool/62">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
              </p>

              {error && (
                <div className="border border-caramel/40 bg-wine/25 p-3 font-secondary text-sm text-cream">
                  {error}
                </div>
              )}

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="brand-input"
                aria-label="Email"
              />

              <button type="submit" disabled={loading} className="brand-button w-full">
                {loading ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>
          )}

          <div className="mt-7 text-center font-secondary text-sm text-wool/62">
            ¿Recuerdas tu contraseña?{" "}
            <Link href="/login" className="font-bold text-caramel hover:text-cream">
              Inicia sesión
            </Link>
          </div>
          <div className="mt-5 text-center">
            <Link href="/" className="font-secondary text-xs text-wool/42 hover:text-wool">
              Volver al inicio
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
