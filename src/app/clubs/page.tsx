"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Users, PlusCircle, Crown, ArrowRight } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";

interface Club {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  created_at: string;
  memberCount: number;
  isMember: boolean;
  role: "admin" | "member" | null;
}

export default function ClubsPage() {
  const { user, loading: authLoading } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const supabase = createClient();

  const fetchClubs = useCallback(async () => {
    if (!user) return;

    const { data: myMemberships } = await supabase
      .from("club_members")
      .select("club_id, role")
      .eq("user_id", user.id);

    const myClubIds = myMemberships?.map((m) => m.club_id) || [];
    const myRoles: Record<string, string> = {};
    myMemberships?.forEach((m) => {
      myRoles[m.club_id] = m.role;
    });

    const { data: myClubsData } = await supabase
      .from("clubs")
      .select("*")
      .in("id", myClubIds);

    const myClubIdsSet = new Set(myClubIds);

    const { data: otherClubsData } = await supabase
      .from("clubs")
      .select("*")
      .not("id", "in", `(${myClubIds.join(",") || "00000000-0000-0000-0000-000000000000"})`);

    const allClubIds = [
      ...myClubIds,
      ...(otherClubsData?.map((c) => c.id) || []),
    ];

    const { data: memberCounts } = await supabase
      .from("club_members")
      .select("club_id")
      .in("club_id", allClubIds);

    const counts: Record<string, number> = {};
    memberCounts?.forEach((m) => {
      counts[m.club_id] = (counts[m.club_id] || 0) + 1;
    });

    const myClubs: Club[] =
      myClubsData?.map((c) => ({
        ...c,
        memberCount: counts[c.id] || 0,
        isMember: true,
        role: (myRoles[c.id] as "admin" | "member") || null,
      })) || [];

    const others: Club[] =
      otherClubsData?.map((c) => ({
        ...c,
        memberCount: counts[c.id] || 0,
        isMember: myClubIdsSet.has(c.id),
        role: myRoles[c.id] as "admin" | "member" | null,
      })) || [];

    setClubs(myClubs);
    setAllClubs(others);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const handleJoin = async (clubId: string) => {
    if (!user || joining) return;
    setJoining(clubId);

    const { error } = await supabase.from("club_members").insert({
      club_id: clubId,
      user_id: user.id,
      role: "member",
    });

    if (!error) {
      fetchClubs();
    }
    setJoining(null);
  };

  const handleLeave = async (clubId: string) => {
    if (!user || joining) return;
    setJoining(clubId);

    const { error } = await supabase
      .from("club_members")
      .delete()
      .eq("club_id", clubId)
      .eq("user_id", user.id);

    if (!error) {
      fetchClubs();
    }
    setJoining(null);
  };

  if (authLoading || loading) {
    return (
      <div className="app-shell">
        <Navigation />
        <main className="px-4 pb-24 pt-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-5 overflow-hidden border border-wool/10 bg-wine/88 py-3">
              <div className="flex whitespace-nowrap">
                <span className="display-title px-5 text-lg text-wool/40 animate-pulse">
                  CARGANDO...
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navigation />

      <main className="px-4 pb-24 pt-20">
        <div className="mx-auto max-w-5xl">
          <section className="mb-5 overflow-hidden border border-wool/10 bg-wine/88 py-3">
            <div className="flex whitespace-nowrap">
              <span className="display-title px-5 text-lg text-wool/80">
                CLUBS
              </span>
              <span className="display-title px-5 text-lg text-wool/80">
                COMUNIDAD
              </span>
              <span className="display-title px-5 text-lg text-wool/80">
                CORREDOR
              </span>
            </div>
          </section>

          <section className="mb-6 grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="brand-panel p-5 sm:p-6">
              <p className="section-kicker mb-3">Comunidad</p>
              <h1 className="display-title text-5xl text-cream sm:text-7xl">
                Tus clubs.
              </h1>
              <p className="mt-4 max-w-2xl font-secondary text-sm leading-6 text-wool/68 sm:text-base">
                Unite a clubs de corredores, compartí entrenamientos y crecé
                junto a tu comunidad.
              </p>
            </div>
            <Link
              href="/clubs/new"
              className="cream-panel flex min-h-40 flex-col justify-between p-5 transition hover:-translate-y-0.5"
            >
              <PlusCircle size={28} className="text-wine" />
              <div>
                <p className="display-title text-4xl">Crear club</p>
                <p className="mt-2 font-secondary text-sm font-semibold text-fire/70">
                  Creá tu propio club y invitá corredores.
                </p>
              </div>
            </Link>
          </section>

          {clubs.length > 0 && (
            <section className="mb-6">
              <h2 className="section-kicker mb-3">Mis clubs</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {clubs.map((club) => (
                  <ClubCard
                    key={club.id}
                    club={club}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                    joining={joining}
                  />
                ))}
              </div>
            </section>
          )}

          {allClubs.length > 0 && (
            <section>
              <h2 className="section-kicker mb-3">Explorar clubs</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {allClubs.map((club) => (
                  <ClubCard
                    key={club.id}
                    club={club}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                    joining={joining}
                  />
                ))}
              </div>
            </section>
          )}

          {clubs.length === 0 && allClubs.length === 0 && (
            <div className="brand-panel px-5 py-16 text-center">
              <div className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-full border border-caramel/30 bg-dark/45">
                <Users size={28} className="text-caramel" />
              </div>
              <p className="display-title text-4xl text-cream">
                No hay clubs aún
              </p>
              <p className="mx-auto mt-2 max-w-sm font-secondary text-sm text-wool/58">
                Sé el primero en crear un club y empezar a construir tu
                comunidad.
              </p>
              <Link href="/clubs/new" className="brand-button mt-7">
                Crear club
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ClubCard({
  club,
  onJoin,
  onLeave,
  joining,
}: {
  club: Club;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  joining: string | null;
}) {
  return (
    <div className="brand-panel overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-caramel/30 bg-chestnut">
            <span className="font-display text-lg text-cream">
              {club.name.charAt(0)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/clubs/${club.slug}`}>
                <h3 className="font-secondary text-sm font-bold text-cream hover:text-caramel transition-colors">
                  {club.name}
                </h3>
              </Link>
              {club.role === "admin" && (
                <Crown size={12} className="text-caramel shrink-0" />
              )}
            </div>
            {club.description && (
              <p className="mt-1 line-clamp-2 font-secondary text-xs leading-5 text-wool/58">
                {club.description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-3">
              <span className="flex items-center gap-1 font-secondary text-[10px] text-wool/42">
                <Users size={11} />
                {club.memberCount} miembro{club.memberCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-wool/10 px-4 py-3">
        <Link
          href={`/clubs/${club.slug}`}
          className="flex items-center gap-1 font-secondary text-xs font-semibold text-caramel transition-colors hover:text-cream"
        >
          Ver club
          <ArrowRight size={12} />
        </Link>
        {club.isMember ? (
          <button
            onClick={() => onLeave(club.id)}
            disabled={joining === club.id}
            className="ghost-button px-3 py-1.5 text-[10px]"
          >
            Salir
          </button>
        ) : (
          <button
            onClick={() => onJoin(club.id)}
            disabled={joining === club.id}
            className="brand-button px-3 py-1.5 text-[10px]"
          >
            Unirme
          </button>
        )}
      </div>
    </div>
  );
}
