import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import { ToastContainer } from './components/ui/Toast';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AuthLayout } from './layouts/AuthLayout';
import { AppLayout } from './layouts/AppLayout';
import { ROUTES } from './constants/routes';

// Lazy-loaded routes for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const FriendsPage = lazy(() => import('./pages/FriendsPage').then((m) => ({ default: m.FriendsPage })));
const SoloPage = lazy(() => import('./pages/SoloPage').then((m) => ({ default: m.SoloPage })));
const PlaylistsPage = lazy(() => import('./pages/PlaylistsPage').then((m) => ({ default: m.PlaylistsPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const RoomPage = lazy(() => import('./pages/RoomPage').then((m) => ({ default: m.RoomPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center p-16">
    <div className="w-10 h-10 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
  </div>
);

export default function App() {
  const { initTheme } = useThemeStore();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    initTheme();
    checkAuth();
  }, [initTheme, checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
            </Route>

            {/* Protected Application Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path={ROUTES.HOME} element={<HomePage />} />
              <Route path={ROUTES.FRIENDS} element={<FriendsPage />} />
              <Route path={ROUTES.SOLO} element={<SoloPage />} />
              <Route path={ROUTES.PLAYLISTS} element={<PlaylistsPage />} />
              <Route path={ROUTES.FAVORITES} element={<FavoritesPage />} />
            </Route>

            {/* Synchronized Room Route (Full Immersion) */}
            <Route
              path="/room/:code"
              element={
                <ProtectedRoute>
                  <RoomPage />
                </ProtectedRoute>
              }
            />

            {/* 404 & Catch-All */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>

        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
