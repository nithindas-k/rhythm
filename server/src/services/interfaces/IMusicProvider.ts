export interface ProviderTrack {
  providerId: string;
  provider: 'jiosaavn' | 's3';
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  durationMs: number;
  coverUrl?: string;
  audioUrl: string;      // Direct playable audio URL
  previewUrl?: string;   // Low-bitrate preview (JioSaavn 96kbps)
  permaUrl?: string;     // Source page URL
}

export interface IMusicProvider {
  searchTracks(query: string, limit?: number): Promise<ProviderTrack[]>;
  getTrackById(id: string): Promise<ProviderTrack | null>;
}
