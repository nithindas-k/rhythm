export const CACHE_KEYS = {
  // Auth
  REFRESH_TOKEN: (hashedToken: string) => `auth:refresh:${hashedToken}`,
  TOKEN_BLOCKLIST: (jti: string) => `auth:blocklist:${jti}`,

  // Presence
  USER_PRESENCE: (userId: string) => `presence:user:${userId}`,

  // Friends
  FRIEND_LIST: (userId: string) => `cache:friends:${userId}`,
  FRIEND_REQUESTS: (userId: string) => `cache:friends:requests:${userId}`,

  // Rooms
  ROOM_STATE: (roomCode: string) => `room:state:${roomCode}`,
  ROOM_META: (roomCode: string) => `cache:room:${roomCode}`,

  // Rate limiting
  RATE_LIMIT_API: (userId: string, window: string) => `ratelimit:api:${userId}:${window}`,
  RATE_LIMIT_SOCKET: (socketId: string, event: string) => `ratelimit:socket:${socketId}:${event}`,

  // Songs & JioSaavn
  SONGS_SEARCH: (queryHash: string) => `cache:songs:search:${queryHash}`,
  SONGS_TRENDING: () => `cache:songs:trending`,
  SONG_PLAY_COUNT: (songId: string) => `song:playcount:${songId}`,
  JIOSAAVN_SEARCH: (queryHash: string) => `cache:jiosaavn:search:${queryHash}`,
  JIOSAAVN_TRACK: (id: string) => `cache:jiosaavn:track:${id}`,
} as const;
