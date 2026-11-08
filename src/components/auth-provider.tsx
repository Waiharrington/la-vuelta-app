"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  membership: { active: boolean; plan: string | null; expiresAt: string | null } | null;
  membershipLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  membership: null,
  membershipLoading: true,
});

async function ensureProfile(supabase: ReturnType<typeof createClient>, user: User) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) {
    const username = user.email?.split("@")[0] || `user-${user.id.slice(0, 8)}`;
    await supabase.from("profiles").insert({
      id: user.id,
      full_name: user.user_metadata?.full_name || username,
      username,
    });
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<AuthContextType["membership"]>(null);
  const [membershipLoading, setMembershipLoading] = useState(true);

  const membershipRequest = useRef(0);

  async function loadMembership(supabase: ReturnType<typeof createClient>, currentUser: User | null) {
    const requestId = ++membershipRequest.current;
    if (!currentUser) {
      setMembership(null);
      setMembershipLoading(false);
      return;
    }
    setMembershipLoading(true);
    try {
      const { data, error } = await supabase
        .from("members")
        .select("plan, fecha_vencimiento, estado")
        .eq("auth_user_id", currentUser.id)
        .maybeSingle();
      if (requestId !== membershipRequest.current) return;
      if (error) {
        setMembership(null);
        return;
      }
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Caracas",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
      setMembership(data ? {
        active: data.estado !== "inactivo" && !!data.fecha_vencimiento && data.fecha_vencimiento >= today,
        plan: data.plan,
        expiresAt: data.fecha_vencimiento,
      } : null);
    } finally {
      if (requestId === membershipRequest.current) setMembershipLoading(false);
    }
  }

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        await ensureProfile(supabase, data.user);
      }
      await loadMembership(supabase, data.user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false);
        void loadMembership(supabase, currentUser);
        if (currentUser) {
          void ensureProfile(supabase, currentUser);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, membership, membershipLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
