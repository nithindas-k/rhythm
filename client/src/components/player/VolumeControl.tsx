import React, { useRef } from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  className?: string;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  className = '',
}) => {
  const barRef = useRef<HTMLDivElement | null>(null);
  const effectiveVolume = isMuted ? 0 : volume;

  const handleBarClick = (e: React.MouseEvent) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newVol = clickX / rect.width;
    onVolumeChange(newVol);
  };

  const renderIcon = () => {
    if (isMuted || effectiveVolume === 0) {
      return <VolumeX className="w-4 h-4 text-red-400" />;
    }
    if (effectiveVolume < 0.5) {
      return <Volume1 className="w-4 h-4 text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]" />;
    }
    return <Volume2 className="w-4 h-4 text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]" />;
  };

  return (
    <div className={`flex items-center gap-2 group ${className}`}>
      <button
        onClick={onToggleMute}
        className="p-1 rounded-md hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {renderIcon()}
      </button>

      <div
        ref={barRef}
        onClick={handleBarClick}
        className="w-20 md:w-24 h-4 flex items-center cursor-pointer relative"
      >
        <div className="w-full h-1 group-hover:h-1.5 rounded-full bg-[var(--surface-elevated)] overflow-hidden transition-all duration-150 relative">
          <div
            className="h-full bg-[var(--foreground-muted)] group-hover:bg-[var(--primary)] transition-colors duration-150 rounded-full"
            style={{ width: `${effectiveVolume * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
