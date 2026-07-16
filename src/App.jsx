import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppErrorBoundary from "./components/AppErrorBoundary";
import BottomNav from "./components/BottomNav";
import DesktopNav from "./components/DesktopNav";
import OfflineNotice from "./components/OfflineNotice";
import RouteLoader from "./components/RouteLoader";
import ScrollToTop from "./components/ScrollToTop";
import NewsDetailPage from "./pages/NewsDetailPage"; // Import page baru

const InfoPage = lazy(() => import("./pages/InfoPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const MembersPage = lazy(() => import("./pages/MembersPage"));
const QuotaPage = lazy(() => import("./pages/QuotaPage"));
const SchedulePage = lazy(() => import("./pages/SchedulePage"));

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <div className="route-shell">
          <a className="skip-link" href="#main-content">
            Lewati ke konten utama
          </a>

          <DesktopNav />
          <OfflineNotice />

          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/quota" replace />} />
              <Route path="/quota" element={<QuotaPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/news/:slug" element={<NewsDetailPage />} />
              <Route path="/info" element={<InfoPage />} />
              <Route path="*" element={<Navigate to="/quota" replace />} />
            </Routes>
          </Suspense>

          <BottomNav />
        </div>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
