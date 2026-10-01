import React from 'react';
import { Compass, Music2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export const SoloPlaceholder: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl glass-panel border border-[var(--border)] max-w-xl mx-auto my-12">
      <div className="w-16 h-16 rounded-2xl bg-[var(--surface-elevated)] flex items-center justify-center mb-5 text-[var(--primary)] border border-[var(--border)] shadow-md">
        <Compass className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-black text-[var(--foreground)] mb-2">
        Solo Music Exploration
      </h2>
      <p className="text-sm text-[var(--foreground-muted)] max-w-md mb-8 leading-relaxed">
        Full audio player engine, waveform sliders, track search, and playlist curation arrive in Phase 10.
      </p>
      <Link
        to={ROUTES.HOME}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-bold shadow-md hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
      >
        <Music2 className="w-4 h-4 fill-current" />
        Back to Home Modes <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};
