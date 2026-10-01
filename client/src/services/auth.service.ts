import { apiClient } from '../lib/axios';
import type { ApiResponse } from '../types/api.types';
import type { User, AuthResponse } from '../types/user.types';

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', input);
    return data.data;
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', input);
    return data.data;
  },

  async googleAuth(idToken: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/google', { idToken });
    return data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get<ApiResponse<User>>('/users/me');
    return data.data;
  },
};
