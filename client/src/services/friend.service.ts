import { apiClient } from '../lib/axios';
import type { ApiResponse } from '../types/api.types';
import type { Friend, FriendRequest, FriendUser } from '../types/friend.types';

export const friendService = {
  async getFriends(): Promise<Friend[]> {
    const { data } = await apiClient.get<ApiResponse<Friend[]>>('/friends');
    return data.data ?? [];
  },

  async getIncomingRequests(): Promise<FriendRequest[]> {
    const { data } = await apiClient.get<ApiResponse<FriendRequest[]>>('/friends/requests');
    return data.data ?? [];
  },

  async getOutgoingRequests(): Promise<FriendRequest[]> {
    const { data } = await apiClient.get<ApiResponse<FriendRequest[]>>('/friends/sent');
    return data.data ?? [];
  },

  async searchUsers(query: string, limit = 10): Promise<FriendUser[]> {
    if (!query.trim()) return [];
    const { data } = await apiClient.get<ApiResponse<FriendUser[]>>('/friends/search', {
      params: { q: query, limit },
    });
    return data.data ?? [];
  },

  async sendRequest(userId: string): Promise<FriendRequest> {
    const { data } = await apiClient.post<ApiResponse<FriendRequest>>('/friends/request', {
      userId,
    });
    return data.data;
  },

  async acceptRequest(requestId: string): Promise<Friend> {
    const { data } = await apiClient.patch<ApiResponse<Friend>>(
      `/friends/request/${requestId}/accept`
    );
    return data.data;
  },

  async rejectRequest(requestId: string): Promise<void> {
    await apiClient.patch(`/friends/request/${requestId}/reject`);
  },

  async cancelRequest(requestId: string): Promise<void> {
    await apiClient.delete(`/friends/request/${requestId}`);
  },

  async removeFriend(friendshipId: string): Promise<void> {
    await apiClient.delete(`/friends/${friendshipId}`);
  },
};
