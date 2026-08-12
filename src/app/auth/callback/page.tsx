"use client";

import { useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/feed";

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          router.replace(next);
        } else {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
        }
      });
    } else {
      router.replace("/feed");
    }
  }, [searchParams, router, supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark">
      <p className="font-secondary text-sm text-wool/45">Iniciando sesión...</p>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-dark">
        <p className="font-secondary text-sm text-wool/45">Cargando...</p>
      </div>
    }>
      <AuthCallbackHandler />
    </Suspense>
  );
}
