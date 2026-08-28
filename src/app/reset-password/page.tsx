"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/feed");
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
            Un nuevo comienzo.
          </h1>
          <p className="mt-6 max-w-lg font-secondary text-lg leading-8 text-wool/76">
            Establece tu nueva contraseña y sigue corriendo con la comunidad.
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
              Nueva contraseña
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="border border-caramel/40 bg-wine/25 p-3 font-secondary text-sm text-cream">
                {error}
              </div>
            )}

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nueva contraseña"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="brand-input pr-12"
                aria-label="Nueva contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-wool/48 transition hover:text-cream"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
                className="brand-input pr-12"
                aria-label="Confirmar contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-wool/48 transition hover:text-cream"
                aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" disabled={loading} className="brand-button w-full">
              {loading ? "Restableciendo..." : "Restablecer contraseña"}
            </button>
          </form>

          <div className="mt-7 text-center font-secondary text-sm text-wool/62">
            <Link href="/login" className="font-bold text-caramel hover:text-cream">
              Volver al inicio de sesión
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
