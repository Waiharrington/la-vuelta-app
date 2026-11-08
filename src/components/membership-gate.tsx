"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

const publicPaths = ["/", "/login", "/register", "/membership-required", "/terms", "/privacy"];

export function MembershipGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, membership, membershipLoading } = useAuth();
  const publicEventPage = pathname === "/events" || (/^\/events\/[^/]+$/.test(pathname) && pathname !== "/events/new");
  const publicPage = publicPaths.includes(pathname) || publicEventPage;

  if (!user || publicPage) return <>{children}</>;
  if (loading || membershipLoading) {
    return <main className="grid min-h-screen place-items-center bg-dark px-6 text-center text-cream"><p className="animate-pulse">Verificando tu membresía…</p></main>;
  }
  if (membership?.active) return <>{children}</>;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-dark px-5 py-12 text-cream">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(116,23,23,.34),transparent_58%)]" />
      <section className="relative w-full max-w-lg border border-wool/10 bg-fire/70 p-7 shadow-2xl shadow-black/40 sm:p-10">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-caramel/30 bg-wine/40 text-caramel"><ShieldCheck size={28} /></div>
        <p className="mb-3 font-secondary text-xs font-bold uppercase tracking-[.22em] text-caramel">La Vuelta RunClub</p>
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">TU PRÓXIMA VUELTA EMPIEZA AQUÍ</h1>
        <p className="mt-4 leading-7 text-wool/75">
          Esta área de la app es para atletas con una suscripción activa. Si ya pagaste, solicita al equipo que vincule tu cuenta de acceso con tu ficha de miembro.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link href="/events" className="flex min-h-12 items-center justify-center gap-2 border border-caramel/50 px-4 py-3 font-secondary text-sm font-bold text-caramel transition hover:bg-caramel/10"><CalendarDays size={17} /> Ver próximas vueltas</Link>
          <a href="https://lavueltarun.vercel.app" className="flex min-h-12 items-center justify-center border border-wool/15 bg-wool/5 px-4 py-3 font-secondary text-sm font-bold transition hover:bg-wool/10">Conocer membresías</a>
        </div>
        <p className="mt-5 text-xs leading-5 text-wool/45">Los encuentros dominicales abiertos siguen disponibles en Eventos para toda la comunidad.</p>
      </section>
    </main>
  );
}
