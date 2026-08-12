import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-fire px-6 text-center">
      <h1 className="display-title text-6xl text-cream">404</h1>
      <p className="mt-4 max-w-sm font-secondary text-base text-wool/68">
        Esta pagina no existe. Volvi al inicio o graba una actividad.
      </p>
      <Link href="/" className="brand-button mt-8">
        Volver al inicio
      </Link>
    </div>
  );
}
