export interface UserDto {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  themePreference: string;
  role: string;
  createdAt: Date;
}

export interface AuthResponseDto {
  user: UserDto;
  accessToken: string;
}
