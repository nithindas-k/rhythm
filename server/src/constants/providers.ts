export const MUSIC_PROVIDERS = {
  JIOSAAVN: 'jiosaavn',
  S3: 's3',
} as const;

export type MusicProviderType = typeof MUSIC_PROVIDERS[keyof typeof MUSIC_PROVIDERS];

export const JIOSAAVN_CONFIG = {
  // Public deployment of cyberboysumanjay/JioSaavnAPI
  BASE_URL: 'https://saavnapi-nine.vercel.app',
  DEFAULT_SEARCH_LIMIT: 20,
  MAX_SEARCH_LIMIT: 50,
} as const;
