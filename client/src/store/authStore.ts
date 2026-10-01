import { create } from 'zustand';
import type { User } from '../types/user.types';
import { apiClient } from '../lib/axios';
import { useThemeStore } from './themeStore';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken) => {
    set({ user, accessToken, isAuthenticated: true, isLoading: false });
    // Apply user's saved theme preference if available
    if (user.themePreference) {
      useThemeStore.getState().setTheme(user.themePreference, false);
    }
  },

  setAccessToken: (accessToken) => {
    set({ accessToken, isAuthenticated: true });
  },

  setUser: (user) => {
    set({ user });
    if (user.themePreference) {
      useThemeStore.getState().setTheme(user.themePreference, false);
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Continue cleanup on network error
    } finally {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // Attempt silent refresh via httpOnly cookie
      const { data } = await apiClient.post('/auth/refresh');
      const token = data.data?.accessToken;
      if (!token) throw new Error('No access token');

      set({ accessToken: token, isAuthenticated: true });

      // Fetch user profile
      const userRes = await apiClient.get('/users/me');
      const user = userRes.data.data;
      if (user) {
        set({ user, isLoading: false });
        if (user.themePreference) {
          useThemeStore.getState().setTheme(user.themePreference, false);
        }
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
