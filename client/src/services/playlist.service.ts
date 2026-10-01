import { apiClient } from '../lib/axios';
import type { Playlist } from '../types/song.types';
import type { ApiResponse } from '../types/api.types';

export interface CreatePlaylistInput {
  name: string;
  description?: string;
  coverUrl?: string;
  isPublic?: boolean;
}

export interface UpdatePlaylistInput {
  name?: string;
  description?: string;
  coverUrl?: string;
  isPublic?: boolean;
}

export const playlistService = {
  async getPlaylists(cursor?: string, limit = 50): Promise<{ playlists: Playlist[]; nextCursor: string | null; hasNextPage: boolean }> {
    const response = await apiClient.get<ApiResponse<Playlist[]>>('/playlists', {
      params: { cursor, limit },
    });
    return {
      playlists: response.data.data || [],
      nextCursor: response.data.meta?.nextCursor ?? null,
      hasNextPage: response.data.meta?.hasNextPage ?? false,
    };
  },

  async getById(id: string): Promise<Playlist> {
    const response = await apiClient.get<ApiResponse<Playlist>>(`/playlists/${id}`);
    return response.data.data;
  },

  async create(data: CreatePlaylistInput): Promise<Playlist> {
    const response = await apiClient.post<ApiResponse<Playlist>>('/playlists', data);
    return response.data.data;
  },

  async update(id: string, data: UpdatePlaylistInput): Promise<Playlist> {
    const response = await apiClient.patch<ApiResponse<Playlist>>(`/playlists/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/playlists/${id}`);
  },

  async addTrack(playlistId: string, songId: string): Promise<Playlist> {
    const response = await apiClient.post<ApiResponse<Playlist>>(`/playlists/${playlistId}/tracks`, { songId });
    return response.data.data;
  },

  async removeTrack(playlistId: string, songId: string): Promise<void> {
    await apiClient.delete(`/playlists/${playlistId}/tracks/${songId}`);
  },

  async reorderTracks(playlistId: string, songIds: string[]): Promise<Playlist> {
    const response = await apiClient.patch<ApiResponse<Playlist>>(`/playlists/${playlistId}/tracks/reorder`, { songIds });
    return response.data.data;
  },
};
