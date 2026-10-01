import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { ROUTES } from '../constants/routes';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-center p-6 text-center">
      <div className="text-7xl font-black text-[var(--primary)] mb-2">404</div>
      <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
      <p className="text-sm text-[var(--foreground-muted)] max-w-sm mb-6">
        The track, playlist, or room you are looking for does not exist or has been moved.
      </p>
      <Link
        to={ROUTES.HOME}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-bold shadow-md hover:bg-[var(--primary-hover)] transition-all"
      >
        <Home className="w-4 h-4" />
        Return Home
      </Link>
    </div>
  );
};
