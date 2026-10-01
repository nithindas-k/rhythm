import type { ThemeColor } from '../constants/themes';

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  themePreference: ThemeColor;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
