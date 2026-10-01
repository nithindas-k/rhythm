export type ThemeColor = 'green' | 'blue' | 'purple' | 'pink' | 'orange';

export interface ThemeOption {
  id: ThemeColor;
  label: string;
  color: string;
  glow: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'green',
    label: 'Spotify Emerald',
    color: '#1db954',
    glow: 'rgba(29, 185, 84, 0.4)',
  },
  {
    id: 'blue',
    label: 'Electric Azure',
    color: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.4)',
  },
  {
    id: 'purple',
    label: 'Neon Violet',
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.4)',
  },
  {
    id: 'pink',
    label: 'Cyber Magenta',
    color: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.4)',
  },
  {
    id: 'orange',
    label: 'Sunset Amber',
    color: '#f97316',
    glow: 'rgba(249, 115, 22, 0.4)',
  },
];
