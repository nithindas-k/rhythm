export interface SongDto {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  durationMs: number;
  coverUrl?: string;
  audioUrl: string;
  previewUrl?: string;  // 96kbps low-bitrate preview
  permaUrl?: string;    // JioSaavn song page URL
  providerId?: string;
  provider: string;
  playCount: number;
}

export interface PlaylistTrackDto {
  songId: string;
  position: number;
  addedAt: Date;
  song?: SongDto;
}

export interface PlaylistDto {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  coverUrl?: string;
  isPublic: boolean;
  trackCount: number;
  tracks: PlaylistTrackDto[];
  createdAt: Date;
}

export interface FavoriteDto {
  id: string;
  song: SongDto;
  createdAt: Date;
}
