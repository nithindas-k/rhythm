import { apiClient } from '../lib/axios';
import type { Favorite } from '../types/song.types';
import type { ApiResponse } from '../types/api.types';

export const favoriteService = {
  async getFavorites(cursor?: string, limit = 50): Promise<{ favorites: Favorite[]; nextCursor: string | null; hasNextPage: boolean }> {
    const response = await apiClient.get<ApiResponse<Favorite[]>>('/favorites', {
      params: { cursor, limit },
    });
    return {
      favorites: response.data.data || [],
      nextCursor: response.data.meta?.nextCursor ?? null,
      hasNextPage: response.data.meta?.hasNextPage ?? false,
    };
  },

  async addFavorite(songId: string): Promise<Favorite> {
    const response = await apiClient.post<ApiResponse<Favorite>>(`/favorites/${songId}`);
    return response.data.data;
  },

  async removeFavorite(songId: string): Promise<void> {
    await apiClient.delete(`/favorites/${songId}`);
  },

  async isFavorited(songId: string): Promise<boolean> {
    const response = await apiClient.get<ApiResponse<{ isFavorited: boolean }>>(`/favorites/${songId}`);
    return Boolean(response.data.data?.isFavorited);
  },
};
