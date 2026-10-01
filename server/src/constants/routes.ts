export const ROUTES = {
  BASE: '/api/v1',

  AUTH: {
    ROOT: '/auth',
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    GOOGLE: '/auth/google',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },

  USERS: {
    ROOT: '/users',
    ME: '/users/me',
    ME_THEME: '/users/me/theme',
  },

  SONGS: {
    ROOT: '/songs',
    TRENDING: '/songs/trending',
    BY_ID: '/songs/:id',
    PLAY: '/songs/:id/play',
  },

  PLAYLISTS: {
    ROOT: '/playlists',
    BY_ID: '/playlists/:id',
    TRACKS: '/playlists/:id/tracks',
    TRACK_BY_SONG: '/playlists/:id/tracks/:songId',
    REORDER: '/playlists/:id/tracks/reorder',
  },

  FAVORITES: {
    ROOT: '/favorites',
    BY_SONG: '/favorites/:songId',
  },

  FRIENDS: {
    ROOT: '/friends',
    REQUESTS: '/friends/requests',
    SENT: '/friends/sent',
    SEARCH: '/friends/search',
    REQUEST: '/friends/request',
    ACCEPT_REQUEST: '/friends/request/:id/accept',
    REJECT_REQUEST: '/friends/request/:id/reject',
    CANCEL_REQUEST: '/friends/request/:id',
    REMOVE: '/friends/:id',
  },

  ROOMS: {
    ROOT: '/rooms',
    BY_CODE: '/rooms/:code',
    HOST: '/rooms/:code/host',
    INVITE: '/rooms/:code/invite',
    MEMBER_CONTROL: '/rooms/:code/members/:userId/control',
    QUEUE: '/rooms/:code/queue',
    QUEUE_SONG: '/rooms/:code/queue/:songId',
  },

  HEALTH: '/health',
} as const;
