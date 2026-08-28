"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Activity, Flame, MapPinned, Trophy } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

const tickerItems = [
  "Nadie corre con ego",
  "Todos los ritmos se respetan",
  "El nuevo se integra",
  "La comunidad va primero",
  "Terminamos con buena vibra",
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/feed");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fire">
        <div className="display-title text-3xl text-cream animate-pulse">
          LA VUELTA
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-dark text-cream">
      <section className="relative flex min-h-screen overflow-hidden">
        <Image
          src="/brand/hero-bg-v3.png"
          alt="Corredores de La Vuelta Running Club"
          fill
          priority
          className="hidden object-cover md:block"
          sizes="100vw"
        />
        <Image
          src="/brand/hero-bg-mobile-v3.png"
          alt="Corredores de La Vuelta Running Club"
          fill
          priority
          className="object-cover md:hidden"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark/55 via-fire/68 to-dark" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(189,105,93,0.25),transparent_28rem)]" />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-5 py-7 sm:px-8">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-full border border-wool/20 bg-dark/35">
                <Image
                  src="/brand/logo-round.png"
                  alt="Logo La Vuelta"
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div>
                <p className="display-title text-2xl tracking-[0.08em]">LA VUELTA</p>
                <p className="font-secondary text-[10px] font-bold uppercase tracking-[0.28em] text-caramel">
Running Club
                </p>
              </div>
            </div>
            <Link href="/login" className="ghost-button hidden sm:inline-flex">
              Entrar
            </Link>
          </header>

          <div className="grid flex-1 items-end gap-10 pb-12 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-0">
            <div>
              <p className="section-kicker mb-4">Maracay, Venezuela</p>
              <h1 className="display-title max-w-4xl text-[clamp(4.4rem,13vw,9.5rem)]">
                Cada vuelta cuenta una historia.
              </h1>
              <p className="mt-6 max-w-xl font-secondary text-base font-medium leading-7 text-wool/82 sm:text-lg">
                Registra tus rutas, comparte cada vuelta y compite con la comunidad.
                No importa tu ritmo. La vuelta se da juntos.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="brand-button">
                  Crear cuenta
                </Link>
                <Link href="/login" className="ghost-button sm:hidden">
                  Ya tengo cuenta
                </Link>
                <Link href="/feed" className="ghost-button hidden sm:inline-flex">
                  Ver comunidad
                </Link>
              </div>
            </div>

            <div className="brand-panel p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: MapPinned, label: "GPS en vivo", value: "Maracay" },
                  { icon: Activity, label: "Feed social", value: "Runs" },
                  { icon: Trophy, label: "Ranking", value: "Semanal" },
                  { icon: Flame, label: "Club", value: "Juntos" },
                ].map((item) => (
                  <div key={item.label} className="metric-card p-4">
                    <item.icon className="mb-5 text-caramel" size={22} />
                    <p className="display-title text-3xl text-cream">{item.value}</p>
                    <p className="mt-1 font-secondary text-[11px] font-bold uppercase tracking-[0.16em] text-wool/52">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 border border-caramel/25 bg-wine/30 p-4">
                <p className="display-title text-3xl text-cream">
                  Corre. Comparte. Repite.
                </p>
                <p className="mt-2 font-secondary text-sm leading-6 text-wool/72">
                  Una app para que cada salida del club tenga mapa, ritmo, historia
                  y aplausos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-wool/20 bg-wine py-4">
        <div className="ticker-animate flex whitespace-nowrap">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="flex">
              {tickerItems.map((item) => (
                <span
                  key={item}
                  className="display-title px-6 text-2xl text-wool sm:text-4xl"
                >
                  {item} {"//"}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
