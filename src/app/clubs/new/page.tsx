"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function NewClubPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = slugify(name);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !name.trim() || saving) return;

      setSaving(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from("clubs")
        .insert({
          name: name.trim(),
          slug,
          description: description.trim() || null,
          created_by: user.id,
        })
        .select("id, slug")
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          setError("Ya existe un club con ese nombre.");
        } else {
          setError("Error al crear el club. Intentá de nuevo.");
        }
        setSaving(false);
        return;
      }

      if (data) {
        await supabase.from("club_members").insert({
          club_id: data.id,
          user_id: user.id,
          role: "admin",
        });

        router.push(`/clubs/${data.slug}`);
      }
    },
    [user, name, description, slug, saving, supabase, router]
  );

  if (authLoading) {
    return (
      <div className="app-shell">
        <Navigation />
        <main className="px-4 pb-24 pt-20">
          <div className="mx-auto max-w-lg">
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
        <div className="mx-auto max-w-lg">
          <Link
            href="/clubs"
            className="mb-5 flex items-center gap-2 font-secondary text-sm text-wool/58 transition-colors hover:text-cream"
          >
            <ArrowLeft size={16} />
            Volver a clubs
          </Link>

          <section className="mb-5 overflow-hidden border border-wool/10 bg-wine/88 py-3">
            <div className="flex whitespace-nowrap">
              <span className="display-title px-5 text-lg text-wool/80">
                CREAR CLUB
              </span>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="brand-panel p-5">
            <p className="section-kicker mb-4">Nuevo club</p>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                  Nombre del club
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Los Corredores del Norte"
                  maxLength={80}
                  required
                  className="brand-input"
                />
                {name && (
                  <p className="mt-1 font-secondary text-[10px] text-wool/32">
                    URL: /clubs/{slug || "..."}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="¿De qué trata tu club? ¿Cuál es su onda?"
                  rows={4}
                  maxLength={300}
                  className="brand-input resize-none"
                />
                <p className="mt-1 text-right font-secondary text-[10px] text-wool/32">
                  {description.length}/300
                </p>
              </div>

              {error && (
                <p className="font-secondary text-xs text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={!name.trim() || saving}
                className="brand-button w-full py-3"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Crear club"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
