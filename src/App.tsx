import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { RequireStudent } from "./components/layout/RequireRole";
import { RouteStub } from "./components/layout/RouteStub";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/app/DashboardPage";

/* Secondary app routes are code-split: the dashboard renders instantly after
   sign-in while the other pages stream in on navigation. */
const CalendarPage = lazy(() =>
  import("./pages/app/CalendarPage").then((m) => ({ default: m.CalendarPage })),
);
const CompaniesPage = lazy(() =>
  import("./pages/app/CompaniesPage").then((m) => ({ default: m.CompaniesPage })),
);
const CompanyDetailPage = lazy(() =>
  import("./pages/app/CompanyDetailPage").then((m) => ({ default: m.CompanyDetailPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/app/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const PrepPage = lazy(() => import("./pages/app/PrepPage").then((m) => ({ default: m.PrepPage })));
const MocksPage = lazy(() =>
  import("./pages/app/MocksPage").then((m) => ({ default: m.MocksPage })),
);
const OffersPage = lazy(() =>
  import("./pages/app/OffersPage").then((m) => ({ default: m.OffersPage })),
);
const ResumePage = lazy(() =>
  import("./pages/app/ResumePage").then((m) => ({ default: m.ResumePage })),
);

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Signed-in app — requires an account with a profile */}
      <Route path="/app" element={<RequireStudent />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="companies/:id" element={<CompanyDetailPage />} />
          <Route path="prep" element={<PrepPage />} />
          <Route path="mocks" element={<MocksPage />} />
          <Route path="resume" element={<ResumePage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<RouteStub title="Page not found" />} />
    </Routes>
  );
}
