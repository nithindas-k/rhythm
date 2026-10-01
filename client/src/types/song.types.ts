export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  durationMs: number;
  coverUrl?: string;
  audioUrl: string;        // Direct AAC stream URL from JioSaavn
  previewUrl?: string;     // 96kbps preview URL
  permaUrl?: string;       // JioSaavn song page URL
  providerId?: string;
  provider: string;
  playCount: number;
}

export interface PlaylistTrack {
  songId: string;
  position: number;
  addedAt: string;
  song?: Song;
}

export interface Playlist {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  coverUrl?: string;
  isPublic: boolean;
  trackCount: number;
  tracks: PlaylistTrack[];
  createdAt: string;
}

export interface Favorite {
  id: string;
  song: Song;
  createdAt: string;
}
