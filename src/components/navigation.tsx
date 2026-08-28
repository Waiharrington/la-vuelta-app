"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-provider";
import { cn } from "@/lib/utils";
import {
  Home,
  Activity,
  PlusCircle,
  User,
  Users,
  LogOut,
  ChevronRight,
  Route,
  Calendar,
  Settings,
  Search,
  Map,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/feed", icon: Home, label: "Inicio" },
  { href: "/activities", icon: Activity, label: "Actividades" },
  { href: "/tracker", icon: PlusCircle, label: "Grabar" },
  { href: "/events", icon: Calendar, label: "Eventos" },
  { href: "/clubs", icon: Users, label: "Clubs" },
  { href: "/search", icon: Search, label: "Buscar" },
  { href: "/routes", icon: Map, label: "Rutas" },
  { href: "/profile", icon: User, label: "Perfil" },
];

export function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const supabase = createClient();

  if (!user) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-wool/10 bg-fire/82 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/feed" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-caramel/45 bg-dark/45 shadow-lg shadow-wine/20">
              <span className="font-display text-lg text-cream">LV</span>
            </div>
            <div className="leading-none">
              <span className="block font-display text-xl tracking-[0.08em] text-cream">
                LA VUELTA
              </span>
              <span className="flex items-center gap-1 font-secondary text-[10px] font-bold uppercase tracking-[0.22em] text-caramel">
                Run club <ChevronRight size={11} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              aria-label="Ajustes"
              className="flex h-10 w-10 items-center justify-center border border-wool/10 bg-dark/35 text-wool/60 transition-colors hover:border-caramel/40 hover:text-cream"
            >
              <Settings size={20} />
            </Link>
            <button
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="flex h-10 w-10 items-center justify-center border border-wool/10 bg-dark/35 text-wool/60 transition-colors hover:border-caramel/40 hover:text-cream"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-wool/10 bg-dark/88 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-lg items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isRecord = item.href === "/tracker";
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "group relative flex min-w-14 flex-col items-center gap-1 px-2 py-2 transition-colors",
                  isRecord
                    ? "text-caramel"
                    : isActive
                      ? "text-cream"
                      : "text-wool/45 hover:text-wool"
                )}
              >
                {isActive && !isRecord && (
                  <span className="absolute -top-px h-0.5 w-8 bg-caramel" />
                )}
                {isRecord ? (
                  <div className="relative -mt-7 flex h-14 w-14 items-center justify-center rounded-full border border-wool/20 bg-wine shadow-2xl shadow-wine/45 transition-transform group-hover:-translate-y-0.5">
                    <span className="absolute inset-1 rounded-full border border-caramel/35" />
                    <item.icon size={26} className="relative text-cream" />
                  </div>
                ) : (
                  <item.icon size={22} strokeWidth={isActive ? 2.6 : 2} />
                )}
                <span
                  className={cn(
                    "font-secondary text-[10px] font-bold uppercase tracking-[0.13em]",
                    isRecord && "text-caramel"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
