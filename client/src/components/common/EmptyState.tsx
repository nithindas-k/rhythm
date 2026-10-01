import React from 'react';
import { Music } from 'lucide-react';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-10 text-center rounded-2xl glass-panel border border-[var(--border)] my-4 ${
        className || ''
      }`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[var(--surface-elevated)] flex items-center justify-center mb-4 text-[var(--foreground-dim)] border border-[var(--border)]">
        {icon || <Music className="w-7 h-7 text-[var(--foreground-dim)]" />}
      </div>
      <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--foreground-muted)] max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
