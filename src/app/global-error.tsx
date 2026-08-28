"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-dark text-cream">
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-wine/40 bg-wine/20">
            <svg
              className="h-10 w-10 text-caramel"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>

          <h1 className="display-title text-4xl text-cream">
            Error inesperado
          </h1>

          <p className="mt-4 max-w-md font-secondary text-base text-wool/60">
            La app encontró un problema y no pudo cargar. Intentá recargar la
            página.
          </p>

          <div className="mt-10 flex gap-4">
            <button onClick={reset} className="brand-button">
              Reintentar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="ghost-button"
            >
              Recargar página
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
