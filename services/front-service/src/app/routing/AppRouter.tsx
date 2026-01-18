import { Route, Routes } from "react-router-dom";
import { publicRoutes, protectedRoutes } from "./routes";
import { LayoutWithNavbar } from "../../shared/ui/LayoutWithNavbar";
import { NotFoundPage } from "../../pages/NotFoundPage";
import { Navigate } from "react-router-dom";
import { routes } from "./routes";

export function AppRouter() {
  return (
    <Routes>
      {/* Rutas públicas (sin Navbar) */}
      {publicRoutes.map((r) => (
        <Route key={r.path} path={r.path} element={r.element} />
      ))}

      {/* Rutas protegidas (con Navbar) */}
      <Route element={<LayoutWithNavbar />}>
        {protectedRoutes.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
      </Route>

      {/* Redirecciones */}
      <Route path="/inicio" element={<Navigate to={routes.home} replace />} />
      
      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}