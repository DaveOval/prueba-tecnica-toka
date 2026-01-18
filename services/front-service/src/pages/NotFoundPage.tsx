import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h1 className="text-2xl font-semibold text-white">404</h1>
        <p className="mt-2 text-slate-300">Esa ruta no existe.</p>

        <Link
          to="/"
          className="mt-4 inline-flex rounded-xl bg-slate-100 px-4 py-2 text-slate-900 hover:bg-white"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
