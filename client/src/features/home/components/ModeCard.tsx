import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface ModeCardProps {
  title: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  onClick: () => void;
  ctaText?: string;
  isPopular?: boolean;
}

export const ModeCard: React.FC<ModeCardProps> = ({
  title,
  badge,
  description,
  icon,
  gradient,
  onClick,
  ctaText = 'Start Listening',
  isPopular = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col justify-between p-7 sm:p-8 rounded-3xl glass-panel border border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-300 cursor-pointer overflow-hidden shadow-xl hover:-translate-y-1.5 hover:shadow-2xl select-none',
        isPopular && 'border-[var(--primary)]/40 hover:border-[var(--primary)]'
      )}
    >
      {/* Dynamic ambient backdrop */}
      <div
        className={cn(
          'absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 rounded-full opacity-10 group-hover:opacity-20 blur-3xl transition-opacity duration-300 pointer-events-none',
          gradient
        )}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 z-10">
        <div className="w-14 h-14 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground)] group-hover:scale-105 group-hover:border-[var(--primary)]/40 transition-all duration-300 shadow-md">
          {icon}
        </div>

        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--foreground-muted)] group-hover:text-[var(--primary)] transition-colors">
          {badge}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 z-10">
        <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight group-hover:text-[var(--primary)] transition-colors duration-200">
          {title}
        </h3>
        <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
          {description}
        </p>
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-[var(--border)] z-10">
        <span className="text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
          {ctaText}
        </span>
        <div className="w-8 h-8 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--foreground-muted)] group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)] group-hover:translate-x-1 transition-all duration-200 shadow-sm">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
