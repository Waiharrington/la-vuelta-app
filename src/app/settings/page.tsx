"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  FileText,
  Info,
  Key,
  LogOut,
  Mail,
  MapPin,
  Shield,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState({
    full_name: "",
    username: "",
    bio: "",
    location: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteFinal, setShowDeleteFinal] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, username, bio, location")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          username: data.username || "",
          bio: data.bio || "",
          location: data.location || "",
        });
      }
    };

    fetchProfile();

    if ("Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }

    const savedEmailPref = localStorage.getItem("lv_email_notifications");
    if (savedEmailPref !== null) {
      setEmailEnabled(savedEmailPref === "true");
    }
  }, [user, supabase]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        username: profile.username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
        bio: profile.bio || null,
        location: profile.location || null,
      })
      .eq("id", user.id);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handlePushToggle = async () => {
    if (!("Notification" in window)) return;

    if (pushEnabled) {
      setPushEnabled(false);
    } else {
      const permission = await Notification.requestPermission();
      setPushEnabled(permission === "granted");
    }
  };

  const handleEmailToggle = () => {
    const next = !emailEnabled;
    setEmailEnabled(next);
    localStorage.setItem("lv_email_notifications", String(next));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fire">
        <div className="display-title text-2xl text-cream animate-pulse">
          CARGANDO...
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navigation />

      <main className="px-4 pb-24 pt-20">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <Link href="/profile" className="ghost-button px-3 py-2">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="display-title text-3xl text-cream">Ajustes</h1>
              <p className="section-kicker">Configuración de tu cuenta</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* ──── Cuenta ──── */}
            <section>
              <SectionTitle icon={Shield} title="Cuenta" />

              <div className="space-y-2">
                <div className="brand-panel flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center border border-caramel/25 bg-wine/25">
                    <Mail size={18} className="text-caramel" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                      Email
                    </p>
                    <p className="truncate font-secondary text-sm text-cream">
                      {user?.email || "—"}
                    </p>
                  </div>
                </div>

                <Link
                  href="/forgot-password"
                  className="brand-panel flex items-center gap-3 p-4 transition hover:-translate-y-0.5"
                >
                  <div className="flex h-10 w-10 items-center justify-center border border-caramel/25 bg-wine/25">
                    <Key size={18} className="text-caramel" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                      Seguridad
                    </p>
                    <p className="font-secondary text-sm text-cream">
                      Cambiar contraseña
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-wool/30" />
                </Link>

                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="brand-panel flex w-full items-center gap-3 p-4 text-left transition hover:-translate-y-0.5"
                >
                  <div className="flex h-10 w-10 items-center justify-center border border-fire/30 bg-fire/20">
                    <LogOut size={18} className="text-fire" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                      Sesión
                    </p>
                    <p className="font-secondary text-sm text-fire">
                      Cerrar sesión
                    </p>
                  </div>
                </button>
              </div>
            </section>

            {/* ──── Perfil ──── */}
            <section>
              <SectionTitle icon={User} title="Perfil" />

              <div className="brand-panel space-y-4 p-5">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={profile.full_name}
                      onChange={(e) =>
                        setProfile({ ...profile, full_name: e.target.value })
                      }
                      placeholder="Tu nombre"
                      className="brand-input"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                      Username
                    </label>
                    <input
                      type="text"
                      value={profile.username}
                      onChange={(e) =>
                        setProfile({ ...profile, username: e.target.value })
                      }
                      placeholder="username"
                      className="brand-input"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                      Bio
                    </label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) =>
                        setProfile({ ...profile, bio: e.target.value })
                      }
                      placeholder="Cuéntanos sobre ti..."
                      rows={3}
                      className="brand-input resize-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-secondary text-[10px] font-bold uppercase tracking-[0.16em] text-wool/42">
                      Ubicación
                    </label>
                    <div className="relative">
                      <MapPin
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-wool/30"
                      />
                      <input
                        type="text"
                        value={profile.location}
                        onChange={(e) =>
                          setProfile({ ...profile, location: e.target.value })
                        }
                        placeholder="Ciudad, País"
                        className="brand-input pl-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-wool/10 pt-4">
                  <Link
                    href="/profile"
                    className="font-secondary text-xs font-bold text-caramel transition hover:text-cream"
                  >
                    Ver perfil completo
                  </Link>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="brand-button px-5 py-2.5 text-xs"
                  >
                    {saving ? (
                      "Guardando..."
                    ) : saved ? (
                      <>
                        <Check size={14} />
                        Guardado
                      </>
                    ) : (
                      "Guardar cambios"
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* ──── Notificaciones ──── */}
            <section>
              <SectionTitle icon={Bell} title="Notificaciones" />

              <div className="brand-panel divide-y divide-wool/10">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center border border-caramel/25 bg-wine/25">
                      <Bell size={18} className="text-caramel" />
                    </div>
                    <div>
                      <p className="font-secondary text-sm font-bold text-cream">
                        Notificaciones push
                      </p>
                      <p className="font-secondary text-[11px] text-wool/50">
                        Recibe alertas en tu dispositivo
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handlePushToggle}
                    className={`toggle-switch ${pushEnabled ? "active" : ""}`}
                    aria-label="Toggle notificaciones push"
                    role="switch"
                    aria-checked={pushEnabled}
                  >
                    <span className="toggle-knob rounded-full" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center border border-caramel/25 bg-wine/25">
                      <Mail size={18} className="text-caramel" />
                    </div>
                    <div>
                      <p className="font-secondary text-sm font-bold text-cream">
                        Notificaciones por email
                      </p>
                      <p className="font-secondary text-[11px] text-wool/50">
                        Resumen semanal y novedades
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleEmailToggle}
                    className={`toggle-switch ${emailEnabled ? "active" : ""}`}
                    aria-label="Toggle notificaciones por email"
                    role="switch"
                    aria-checked={emailEnabled}
                  >
                    <span className="toggle-knob rounded-full" />
                  </button>
                </div>
              </div>
            </section>

            {/* ──── Acerca de ──── */}
            <section>
              <SectionTitle icon={Info} title="Acerca de" />

              <div className="brand-panel divide-y divide-wool/10">
                <div className="p-4">
                  <p className="font-secondary text-sm font-bold text-cream">
                    La Vuelta Running Club
                  </p>
                  <p className="font-secondary text-[11px] text-wool/50">
                    Maracay, Venezuela
                  </p>
                </div>

                <div className="flex items-center justify-between p-4">
                  <p className="font-secondary text-sm text-wool/60">
                    Versión
                  </p>
                  <span className="font-secondary text-sm font-bold text-caramel">
                    1.0.0
                  </span>
                </div>

                <Link
                  href="/terms"
                  className="flex items-center justify-between p-4 transition hover:bg-wool/5"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-wool/40" />
                    <p className="font-secondary text-sm text-cream">
                      Términos de uso
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-wool/30" />
                </Link>

                <Link
                  href="/privacy"
                  className="flex items-center justify-between p-4 transition hover:bg-wool/5"
                >
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-wool/40" />
                    <p className="font-secondary text-sm text-cream">
                      Política de privacidad
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-wool/30" />
                </Link>
              </div>
            </section>

            {/* ──── Danger Zone ──── */}
            <section>
              <SectionTitle icon={Trash2} title="Zona de peligro" danger />

              <div className="border border-fire/25 bg-fire/5 p-5">
                <p className="font-secondary text-sm font-bold text-cream">
                  Eliminar cuenta
                </p>
                <p className="mt-1 font-secondary text-[11px] leading-5 text-wool/50">
                  Esta acción es irreversible. Se eliminarán tus datos, actividades y registros de forma permanente.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="mt-4 inline-flex items-center gap-2 border border-fire/40 bg-fire/15 px-4 py-2.5 font-secondary text-xs font-bold uppercase tracking-wider text-fire transition hover:bg-fire/25"
                >
                  <Trash2 size={14} />
                  Eliminar cuenta
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* ──── Logout Confirmation Modal ──── */}
      {showLogoutConfirm && (
        <Modal onClose={() => setShowLogoutConfirm(false)}>
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-fire/30 bg-fire/15">
              <LogOut size={24} className="text-fire" />
            </div>
            <h3 className="display-title text-2xl text-cream">
              Cerrar sesión
            </h3>
            <p className="mt-2 font-secondary text-sm text-wool/60">
              ¿Estás seguro que deseas cerrar sesión?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="ghost-button flex-1 px-4 py-3"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="brand-button flex-1 border-fire/40 bg-fire px-4 py-3"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ──── Delete Account First Confirmation ──── */}
      {showDeleteConfirm && !showDeleteFinal && (
        <Modal onClose={() => { setShowDeleteConfirm(false); setShowDeleteFinal(false); }}>
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-fire/30 bg-fire/15">
              <Trash2 size={24} className="text-fire" />
            </div>
            <h3 className="display-title text-2xl text-cream">
              ¿Eliminar cuenta?
            </h3>
            <p className="mt-2 font-secondary text-sm leading-5 text-wool/60">
              Esta acción no se puede deshacer. Se eliminarán permanentemente
              todos tus datos, actividades y registros.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="ghost-button flex-1 px-4 py-3"
              >
                No, cancelar
              </button>
              <button
                onClick={() => setShowDeleteFinal(true)}
                className="brand-button flex-1 border-fire/40 bg-fire px-4 py-3"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ──── Delete Account Final Confirmation ──── */}
      {showDeleteFinal && (
        <Modal onClose={() => { setShowDeleteConfirm(false); setShowDeleteFinal(false); }}>
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-fire/50 bg-fire/25">
              <Shield size={24} className="text-fire" />
            </div>
            <h3 className="display-title text-2xl text-cream">
              Confirmación final
            </h3>
            <p className="mt-2 font-secondary text-sm leading-5 text-wool/60">
              La eliminación de cuenta requiere contacto con soporte. Envía un
              email a{" "}
              <span className="font-bold text-caramel">
                soporte@lavuelta.club
              </span>{" "}
              desde tu correo registrado para solicitar la eliminación de tu
              cuenta.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setShowDeleteFinal(false); }}
                className="brand-button flex-1 px-4 py-3"
              >
                Entendido
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  danger = false,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  danger?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon
        size={16}
        className={danger ? "text-fire" : "text-caramel"}
      />
      <h2
        className={`font-secondary text-xs font-bold uppercase tracking-[0.18em] ${
          danger ? "text-fire" : "text-caramel"
        }`}
      >
        {title}
      </h2>
    </div>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-dark/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm border border-wool/15 bg-dark/95 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
