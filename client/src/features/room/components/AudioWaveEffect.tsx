import React from 'react';

interface AudioWaveEffectProps {
  isPlaying: boolean;
  className?: string;
}

const BARS = [
  { duration: '0.65s', delay: '0.0s' },
  { duration: '0.85s', delay: '0.2s' },
  { duration: '0.55s', delay: '0.1s' },
  { duration: '0.95s', delay: '0.35s' },
  { duration: '0.7s', delay: '0.15s' },
  { duration: '0.8s', delay: '0.25s' },
];

export const AudioWaveEffect: React.FC<AudioWaveEffectProps> = ({ isPlaying, className = '' }) => {
  return (
    <div
      className={`flex items-center gap-1 h-8 px-2.5 rounded-full bg-zinc-900/80 border border-zinc-800/80 transition-colors ${className}`}
      title={isPlaying ? 'Music playing in sync' : 'Playback paused'}
    >
      <div className="flex items-center gap-[3px] h-5">
        {BARS.map((bar, i) => (
          <span
            key={i}
            className={`w-[3px] rounded-full transition-all duration-300 ${
              isPlaying
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                : 'bg-zinc-600 h-1'
            }`}
            style={{
              animation: isPlaying
                ? `audioWaveBar ${bar.duration} ease-in-out infinite alternate ${bar.delay}`
                : 'none',
            }}
          />
        ))}
      </div>
      <span className="text-[10px] font-semibold tracking-wider uppercase ml-1 select-none leading-none text-zinc-400">
        {isPlaying ? 'Live' : 'Off'}
      </span>
    </div>
  );
};
