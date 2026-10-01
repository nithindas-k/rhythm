import React from 'react';
import { MUSIC_GENRES } from '../../constants/genres';
import { cn } from '../../utils/cn';

interface GenrePillsProps {
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
}

export const GenrePills: React.FC<GenrePillsProps> = ({
  selectedGenre,
  onSelectGenre,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
      {MUSIC_GENRES.map((genre) => {
        const isSelected = selectedGenre === genre || (genre === 'All' && !selectedGenre);

        return (
          <button
            key={genre}
            onClick={() => onSelectGenre(genre === 'All' ? '' : genre)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer select-none',
              isSelected
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm glow-primary-sm font-bold'
                : 'bg-[var(--surface-elevated)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] border border-[var(--border)]'
            )}
          >
            {genre}
          </button>
        );
      })}
    </div>
  );
};
