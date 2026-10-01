export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  SOLO: '/solo',
  SEARCH: '/search',
  PLAYLISTS: '/playlists',
  PLAYLIST_DETAIL: (id: string) => `/playlists/${id}`,
  FAVORITES: '/favorites',
  FRIENDS: '/friends',
  ROOM: (code: string) => `/room/${code}`,
  SETTINGS: '/settings',
} as const;
