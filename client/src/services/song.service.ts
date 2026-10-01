import { apiClient } from '../lib/axios';
import type { Song } from '../types/song.types';
import type { ApiResponse } from '../types/api.types';

export interface SongSearchParams {
  q?: string;
  genre?: string;
  sort?: 'trending' | 'newest' | 'oldest';
  cursor?: string;
  limit?: number;
}

export interface SongSearchResponse {
  songs: Song[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export const songService = {
  async search(params: SongSearchParams = {}): Promise<{ songs: Song[]; nextCursor: string | null; hasNextPage: boolean }> {
    const response = await apiClient.get<ApiResponse<Song[]>>('/songs', { params });
    return {
      songs: response.data.data || [],
      nextCursor: response.data.meta?.nextCursor ?? null,
      hasNextPage: response.data.meta?.hasNextPage ?? false,
    };
  },

  async getTrending(limit = 10): Promise<Song[]> {
    const response = await apiClient.get<ApiResponse<Song[]>>('/songs/trending', {
      params: { limit },
    });
    return response.data.data || [];
  },

  async getById(id: string): Promise<Song> {
    const response = await apiClient.get<ApiResponse<Song>>(`/songs/${id}`);
    return response.data.data;
  },

  async recordPlay(id: string): Promise<void> {
    await apiClient.post(`/songs/${id}/play`);
  },
};
