import { Link, NavLink, Outlet } from "react-router-dom";
import Container from "./Container";
import { useAuth } from "../hooks/useAuth";
import { routes } from "../../app/routing/routes";

function classNames(...xs: Array<string | false | undefined>) {
    return xs.filter(Boolean).join(" ");
}

export function LayoutWithNavbar() {
    const { user, logout, isAuthenticated } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <header className="border-b border-slate-800/70 bg-slate-950/70 backdrop-blur">
                <Container>
                    <div className="flex h-14 items-center justify-between">
                        <Link to={routes.home} className="font-semibold tracking-tight">
                            MyApp
                        </Link>

                        <nav className="flex items-center gap-3 text-sm">
                            <NavLink
                                to={routes.home}
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

                            {user?.role === 'admin' && (
                                <NavLink
                                    to={routes.users}
                                    className={({ isActive }) =>
                                        classNames(
                                            "rounded-md px-3 py-1.5 transition",
                                            isActive
                                                ? "bg-slate-800 text-white"
                                                : "text-slate-300 hover:bg-slate-900 hover:text-white"
                                        )
                                    }
                                >
                                    Usuarios
                                </NavLink>
                            )}

                            {isAuthenticated && (
                                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-700">
                                    <span className="text-slate-400 text-xs">
                                        {user?.email}
                                    </span>
                                    {user?.role === 'admin' && (
                                        <span className="px-2 py-0.5 text-xs bg-blue-600/20 text-blue-400 rounded">
                                            Admin
                                        </span>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        className="rounded-md px-3 py-1.5 text-slate-300 hover:bg-slate-900 hover:text-white transition"
                                    >
                                        Salir
                                    </button>
                                </div>
                            )}
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
