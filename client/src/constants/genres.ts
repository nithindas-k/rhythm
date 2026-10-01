export const MUSIC_GENRES = [
  'All',
  'Lo-Fi',
  'Electronic',
  'Acoustic',
  'Indie Rock',
  'Ambient',
  'Funk',
  'Pop',
  'Hip-Hop',
  'Rock',
  'Jazz',
] as const;

export type MusicGenre = (typeof MUSIC_GENRES)[number];
