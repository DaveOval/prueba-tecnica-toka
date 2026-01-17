import { Route, Routes } from "react-router-dom";
import { appRoutes } from "./routes";
import { AppShell } from "../../shared/ui/Navbar";

export function AppRouter() {
  return (
    <Routes>
      {/* Layout general */}
      <Route element={<AppShell />}>
        {appRoutes.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
      </Route>
    </Routes>
  );
}