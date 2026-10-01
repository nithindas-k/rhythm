import React, { useState, useRef, useCallback } from 'react';
import { formatTime } from '../../utils/formatTime';

interface ProgressSliderProps {
  currentMs: number;
  durationMs: number;
  onSeek: (positionMs: number) => void;
  className?: string;
}

export const ProgressSlider: React.FC<ProgressSliderProps> = ({
  currentMs,
  durationMs,
  onSeek,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMs, setDragMs] = useState(0);
  const [hoverMs, setHoverMs] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);
  const barRef = useRef<HTMLDivElement | null>(null);

  const effectiveMs = isDragging ? dragMs : currentMs;
  const percentage = durationMs > 0 ? Math.min(100, Math.max(0, (effectiveMs / durationMs) * 100)) : 0;

  const calculateMsFromEvent = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!barRef.current || durationMs <= 0) return 0;
      const rect = barRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const ratio = clickX / rect.width;
      return Math.round(ratio * durationMs);
    },
    [durationMs]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const newMs = calculateMsFromEvent(e);
    setDragMs(newMs);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const ms = calculateMsFromEvent(moveEvent);
      setDragMs(ms);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const finalMs = calculateMsFromEvent(upEvent);
      setIsDragging(false);
      onSeek(finalMs);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!barRef.current || durationMs <= 0) return;
    const rect = barRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setHoverX(x);
    setHoverMs(Math.round((x / rect.width) * durationMs));
  };

  const handleMouseLeave = () => {
    setHoverMs(null);
  };

  return (
    <div
      ref={barRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-4 flex items-center cursor-pointer group select-none ${className}`}
    >
      {/* Hover time tooltip */}
      {hoverMs !== null && !isDragging && (
        <div
          className="absolute -top-7 transform -translate-x-1/2 px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--surface-overlay)] text-[var(--foreground)] border border-[var(--border)] shadow-md pointer-events-none transition-opacity duration-150"
          style={{ left: `${hoverX}px` }}
        >
          {formatTime(hoverMs, true)}
        </div>
      )}

      {/* Track background */}
      <div className="w-full h-1 group-hover:h-1.5 rounded-full bg-[var(--surface-elevated)] overflow-hidden transition-all duration-150 relative">
        {/* Progress fill */}
        <div
          className="h-full bg-[var(--foreground-muted)] group-hover:bg-[var(--primary)] transition-colors duration-150 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Thumb handle */}
      <div
        className="absolute w-3 h-3 rounded-full bg-[var(--foreground)] shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 -translate-x-1/2 pointer-events-none"
        style={{ left: `${percentage}%` }}
      />
    </div>
  );
};
