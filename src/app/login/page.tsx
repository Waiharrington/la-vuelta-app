"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/feed");
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
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
            Tu ruta vive aquí.
          </h1>
          <p className="mt-6 max-w-lg font-secondary text-lg leading-8 text-wool/76">
            Entra para ver el feed, grabar tu próxima carrera y seguir el ritmo
            de la comunidad.
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
              Iniciar sesión
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="mb-5 flex w-full items-center justify-center gap-3 bg-cream px-4 py-3.5 font-secondary text-sm font-bold uppercase tracking-[0.08em] text-fire transition hover:bg-wool disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {googleLoading ? "Conectando..." : "Continuar con Google"}
          </button>

          <div className="mb-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-wool/14" />
            <span className="font-secondary text-xs uppercase tracking-[0.18em] text-wool/42">
              o
            </span>
            <div className="h-px flex-1 bg-wool/14" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
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

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="brand-input pr-12"
                aria-label="Contraseña"
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

            <button type="submit" disabled={loading} className="brand-button w-full">
              {loading ? "Entrando..." : "Iniciar sesión"}
            </button>

            <div className="text-center">
              <Link
                href="/forgot-password"
                className="font-secondary text-xs text-wool/42 hover:text-wool"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>

          <div className="mt-7 text-center font-secondary text-sm text-wool/62">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-bold text-caramel hover:text-cream">
              Regístrate
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
