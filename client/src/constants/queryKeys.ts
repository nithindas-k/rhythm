export const QUERY_KEYS = {
  USER: {
    ME: ['user', 'me'] as const,
  },
  SONGS: {
    ALL: ['songs'] as const,
    SEARCH: (params: Record<string, unknown>) => ['songs', 'search', params] as const,
    TRENDING: ['songs', 'trending'] as const,
    DETAIL: (id: string) => ['songs', id] as const,
  },
  PLAYLISTS: {
    ALL: ['playlists'] as const,
    DETAIL: (id: string) => ['playlists', id] as const,
  },
  FAVORITES: {
    ALL: ['favorites'] as const,
    CHECK: (songId: string) => ['favorites', 'check', songId] as const,
  },
  FRIENDS: {
    LIST: ['friends', 'list'] as const,
    REQUESTS: ['friends', 'requests'] as const,
    SENT: ['friends', 'sent'] as const,
    SEARCH: (q: string) => ['friends', 'search', q] as const,
  },
  ROOM: {
    DETAIL: (code: string) => ['room', code] as const,
  },
} as const;
