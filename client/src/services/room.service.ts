import { apiClient } from '../lib/axios';
import type { ApiResponse } from '../types/api.types';
import type { Room } from '../types/room.types';

export const roomService = {
  async createRoom(type: 'couples' | 'party'): Promise<Room> {
    const { data } = await apiClient.post<ApiResponse<Room>>('/rooms', { type });
    return data.data;
  },

  async getByCode(code: string): Promise<Room> {
    const { data } = await apiClient.get<ApiResponse<Room>>(`/rooms/${code}`);
    return data.data;
  },

  async transferHost(code: string, newHostId: string): Promise<Room> {
    const { data } = await apiClient.patch<ApiResponse<Room>>(`/rooms/${code}/host`, {
      newHostId,
    });
    return data.data;
  },

  async endRoom(code: string): Promise<void> {
    await apiClient.delete(`/rooms/${code}`);
  },

  async invite(code: string, userId: string): Promise<void> {
    await apiClient.post(`/rooms/${code}/invite`, { userId });
  },

  async updateControl(code: string, userId: string, hasControl: boolean): Promise<Room> {
    const { data } = await apiClient.patch<ApiResponse<Room>>(
      `/rooms/${code}/members/${userId}/control`,
      { hasControl }
    );
    return data.data;
  },

  async addToQueue(code: string, songId: string): Promise<Room> {
    const { data } = await apiClient.post<ApiResponse<Room>>(`/rooms/${code}/queue`, {
      songId,
    });
    return data.data;
  },

  async removeFromQueue(code: string, songId: string): Promise<Room> {
    const { data } = await apiClient.delete<ApiResponse<Room>>(
      `/rooms/${code}/queue/${songId}`
    );
    return data.data;
  },
};
