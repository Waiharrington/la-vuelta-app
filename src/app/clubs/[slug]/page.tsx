"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, use } from "react";
import {
  ArrowLeft,
  Users,
  Crown,
  Calendar,
  Loader2,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

interface ClubData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
}

interface Member {
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export default function ClubDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user, loading: authLoading } = useAuth();
  const [club, setClub] = useState<ClubData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "member" | null>(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const supabase = createClient();

  const fetchClub = useCallback(async () => {
    const { data: clubData } = await supabase
      .from("clubs")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!clubData) {
      setLoading(false);
      return;
    }

    setClub(clubData);

    const { data: membersData } = await supabase
      .from("club_members")
      .select("user_id, role, joined_at, profiles(full_name, username, avatar_url)")
      .eq("club_id", clubData.id)
      .order("joined_at", { ascending: true });

    if (membersData) {
      setMembers(membersData as unknown as Member[]);
    }

    if (user) {
      const membership = membersData?.find((m) => m.user_id === user.id);
      setIsMember(!!membership);
      setUserRole(
        membership ? (membership.role as "admin" | "member") : null
      );
    }

    setLoading(false);
  }, [slug, user, supabase]);

  useEffect(() => {
    fetchClub();
  }, [fetchClub]);

  const handleJoin = async () => {
    if (!user || !club || joining) return;
    setJoining(true);

    const { error } = await supabase.from("club_members").insert({
      club_id: club.id,
      user_id: user.id,
      role: "member",
    });

    if (!error) {
      fetchClub();
    }
    setJoining(false);
  };

  const handleLeave = async () => {
    if (!user || !club || leaving) return;
    setLeaving(true);

    const { error } = await supabase
      .from("club_members")
      .delete()
      .eq("club_id", club.id)
      .eq("user_id", user.id);

    if (!error) {
      fetchClub();
    }
    setLeaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="app-shell">
        <Navigation />
        <main className="px-4 pb-24 pt-20">
          <div className="mx-auto max-w-4xl">
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

  if (!club) {
    return (
      <div className="app-shell">
        <Navigation />
        <main className="px-4 pb-24 pt-20">
          <div className="mx-auto max-w-4xl">
            <Link
              href="/clubs"
              className="mb-5 flex items-center gap-2 font-secondary text-sm text-wool/58 transition-colors hover:text-cream"
            >
              <ArrowLeft size={16} />
              Volver a clubs
            </Link>
            <div className="brand-panel px-5 py-16 text-center">
              <p className="display-title text-4xl text-cream">
                Club no encontrado
              </p>
              <Link href="/clubs" className="brand-button mt-6">
                Ver clubs
              </Link>
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
        <div className="mx-auto max-w-4xl">
          <Link
            href="/clubs"
            className="mb-5 flex items-center gap-2 font-secondary text-sm text-wool/58 transition-colors hover:text-cream"
          >
            <ArrowLeft size={16} />
            Volver a clubs
          </Link>

          <section className="brand-panel mb-5 overflow-hidden">
            <div className="h-28 border-b border-wool/10 bg-[linear-gradient(120deg,rgba(116,23,23,0.75),rgba(189,105,93,0.32)),url('/brand/hero-bg-v3.png')] bg-cover bg-center" />
            <div className="px-5 pb-6">
              <div className="-mt-12 mb-4 flex items-end justify-between gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-caramel bg-chestnut shadow-xl shadow-dark/30">
                  <span className="font-display text-4xl text-cream uppercase">
                    {club.name.charAt(0)}
                  </span>
                </div>
                <div className="flex gap-2">
                  {isMember ? (
                    <button
                      onClick={handleLeave}
                      disabled={leaving}
                      className="ghost-button px-4"
                    >
                      {leaving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        "Salir"
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleJoin}
                      disabled={joining}
                      className="brand-button px-4"
                    >
                      {joining ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        "Unirme"
                      )}
                    </button>
                  )}
                </div>
              </div>

              <p className="section-kicker">Club</p>
              <h1 className="display-title mt-2 text-5xl text-cream">
                {club.name}
              </h1>

              {club.description && (
                <p className="mt-4 max-w-2xl font-secondary text-sm leading-6 text-wool/68">
                  {club.description}
                </p>
              )}

              <div className="mt-4 flex items-center gap-4">
                <span className="flex items-center gap-1 font-secondary text-xs text-wool/42">
                  <Users size={14} />
                  {members.length} miembro{members.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1 font-secondary text-xs text-wool/42">
                  <Calendar size={14} />
                  {formatDate(club.created_at)}
                </span>
              </div>
            </div>
          </section>

          <section className="mb-5">
            <h2 className="section-kicker mb-3">
              Miembros ({members.length})
            </h2>
            <div className="brand-panel divide-y divide-wool/10">
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-3 p-4"
                >
                  <Link
                    href={`/users/${member.user_id}`}
                    className="shrink-0"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-caramel/30 bg-chestnut">
                      <span className="font-display text-sm text-cream">
                        {member.profiles?.full_name?.charAt(0) || "U"}
                      </span>
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/users/${member.user_id}`}>
                      <p className="truncate font-secondary text-sm font-bold text-cream hover:text-caramel transition-colors">
                        {member.profiles?.full_name || "Runner"}
                      </p>
                    </Link>
                    <p className="font-secondary text-[10px] text-wool/32">
                      @{member.profiles?.username || "runner"}
                    </p>
                  </div>
                  {member.role === "admin" && (
                    <span className="flex items-center gap-1 font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-caramel">
                      <Crown size={11} />
                      Admin
                    </span>
                  )}
                </div>
              ))}
              {members.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <p className="font-secondary text-sm text-wool/42">
                    No hay miembros todavía.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
