import { create } from 'zustand';
import type { ThemeColor } from '../constants/themes';
import { apiClient } from '../lib/axios';

interface ThemeState {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor, syncWithBackend?: boolean) => Promise<void>;
  initTheme: () => void;
}

const STORAGE_KEY = 'rhythm_theme_preference';

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'green',

  initTheme: () => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeColor | null;
    const initialTheme: ThemeColor = saved && ['green', 'blue', 'purple', 'pink', 'orange'].includes(saved)
      ? saved
      : 'green';

    document.documentElement.setAttribute('data-theme', initialTheme);
    set({ theme: initialTheme });
  },

  setTheme: async (newTheme: ThemeColor, syncWithBackend = false) => {
    // 1. Instant local DOM update
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    set({ theme: newTheme });

    // 2. Sync to backend if authenticated
    if (syncWithBackend) {
      try {
        await apiClient.patch('/users/me/theme', { theme: newTheme });
      } catch {
        // Silently continue if user is not authenticated yet
      }
    }
  },
}));
