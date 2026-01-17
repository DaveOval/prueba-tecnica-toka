export default function HomePage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
        <h1 className="text-2xl font-semibold tracking-tight">Página de inicio</h1>
        <p className="mt-2 text-slate-300">
          Starter con React Router + Redux Toolkit + Tailwind.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow">
        <h2 className="text-lg font-semibold">Redux demo</h2>

        <div className="mt-4 flex flex-wrap items-center gap-3">
        </div>
      </div>

      <div className="text-sm text-slate-400">
        Tip: agrega más páginas en <code className="rounded bg-slate-900 px-1">src/pages</code> y
        rutas en <code className="rounded bg-slate-900 px-1">src/app/routing/routes.tsx</code>.
      </div>
    </section>
  );
}
