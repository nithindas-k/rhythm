import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Music2 } from 'lucide-react';
import { ThemeSelector } from '../components/theme/ThemeSelector';
import { ROUTES } from '../constants/routes';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col justify-between relative overflow-hidden">
      {/* Dynamic ambient backdrop glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-[var(--primary)] opacity-[0.08] blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-10">
        <Link to={ROUTES.HOME} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] shadow-lg glow-primary-sm group-hover:scale-105 transition-transform duration-200">
            <Music2 className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-black tracking-tight text-[var(--foreground)]">
            Rhythm
          </span>
        </Link>

        <ThemeSelector />
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md glass-panel p-8 sm:p-10 rounded-3xl border border-[var(--border)] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-[var(--foreground-dim)] z-10">
        Rhythm &bull; Real-time synchronized music streaming
      </footer>
    </div>
  );
};
