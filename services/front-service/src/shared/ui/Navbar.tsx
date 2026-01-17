import { Link, NavLink, Outlet } from "react-router-dom";
import Container from "./Container";


function classNames(...xs: Array<string | false | undefined>) {
    return xs.filter(Boolean).join(" ");
}

export function AppShell() {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="border-b border-slate-800/70 bg-slate-950/70 backdrop-blur">
          <Container>
            <div className="flex h-14 items-center justify-between">
              <Link to="/" className="font-semibold tracking-tight">
                MyApp
              </Link>
  
              <nav className="flex items-center gap-3 text-sm">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    classNames(
                      "rounded-md px-3 py-1.5 transition",
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    )
                  }
                >
                  Inicio
                </NavLink>
  
                <a
                  className="rounded-md px-3 py-1.5 text-slate-300 hover:bg-slate-900 hover:text-white"
                  href="https://tailwindcss.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  Tailwind
                </a>
              </nav>
            </div>
          </Container>
        </header>
  
        <main className="py-8">
          <Container>
            <Outlet />
          </Container>
        </main>
  
        <footer className="border-t border-slate-800/70 py-6 text-center text-xs text-slate-400">
          <Container>© {new Date().getFullYear()} MyApp</Container>
        </footer>
      </div>
    );
  }