import { NavLink } from 'react-router-dom';
import { routes } from '../../app/routing/routes';

function classNames(...xs: Array<string | false | undefined>) {
    return xs.filter(Boolean).join(" ");
}

export function AINavigation() {
    return (
        <div className="mb-6 border-b border-slate-800">
            <nav className="flex gap-1">
                <NavLink
                    to={routes.ai}
                    className={({ isActive }) =>
                        classNames(
                            "px-4 py-2 text-sm font-medium transition rounded-t-lg",
                            isActive
                                ? "bg-slate-800 text-white border-b-2 border-purple-500"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                        )
                    }
                >
                    Chat
                </NavLink>
                <NavLink
                    to={routes.aiDocuments}
                    className={({ isActive }) =>
                        classNames(
                            "px-4 py-2 text-sm font-medium transition rounded-t-lg",
                            isActive
                                ? "bg-slate-800 text-white border-b-2 border-purple-500"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                        )
                    }
                >
                    Documentos
                </NavLink>
                <NavLink
                    to={routes.aiPrompts}
                    className={({ isActive }) =>
                        classNames(
                            "px-4 py-2 text-sm font-medium transition rounded-t-lg",
                            isActive
                                ? "bg-slate-800 text-white border-b-2 border-purple-500"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                        )
                    }
                >
                    Prompts
                </NavLink>
                <NavLink
                    to={routes.aiMetrics}
                    className={({ isActive }) =>
                        classNames(
                            "px-4 py-2 text-sm font-medium transition rounded-t-lg",
                            isActive
                                ? "bg-slate-800 text-white border-b-2 border-purple-500"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                        )
                    }
                >
                    Métricas
                </NavLink>
            </nav>
        </div>
    );
}
