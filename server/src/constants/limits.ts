// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  CURSOR_FIELD: '_id',
} as const;

// Redis TTLs (in seconds)
export const TTL = {
  REFRESH_TOKEN: 60 * 60 * 24 * 7,          // 7 days
  ACCESS_TOKEN_BLOCKLIST: 60 * 15,           // 15 min (matches token expiry)
  USER_PRESENCE: 30,                          // 30 seconds (heartbeat-renewed)
  FRIEND_LIST: 60 * 5,                        // 5 min
  FRIEND_REQUESTS: 60 * 2,                    // 2 min
  ROOM_STATE: 60 * 60 * 24,                   // 24 h
  ROOM_META: 60 * 60,                         // 1 h
  SONGS_SEARCH: 60 * 3,                       // 3 min
  SONGS_TRENDING: 60 * 10,                    // 10 min
  JIOSAAVN_SEARCH: 60 * 60 * 6,               // 6 h (audio CDN URLs can rotate)
} as const;

// Room limits
export const ROOM_LIMITS = {
  COUPLES_MAX_MEMBERS: 2,
  PARTY_MAX_MEMBERS: 50,
  CODE_LENGTH: 6,
} as const;

// Playlist limits
export const PLAYLIST_LIMITS = {
  MAX_TRACKS: 500,
  MAX_PER_USER: 100,
} as const;

// Friend limits
export const FRIEND_LIMITS = {
  MAX_FRIENDS: 500,
  MAX_PENDING_REQUESTS: 100,
} as const;

// Socket rate limiting
export const SOCKET_RATE_LIMITS = {
  PLAYBACK_EVENTS_PER_SECOND: 5,
  CHAT_MESSAGES_PER_MINUTE: 30,
} as const;

// Refresh token
export const REFRESH_TOKEN = {
  MAX_PER_USER: 5,
} as const;
