import { UserDto } from '../../dtos/auth/auth.dto';
import { UpdateProfileDto, UpdateThemeDto } from '../../validators/user.validator';

export interface IUserService {
  getProfile(userId: string): Promise<UserDto>;
  updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserDto>;
  updateTheme(userId: string, dto: UpdateThemeDto): Promise<UserDto>;
  deleteAccount(userId: string): Promise<void>;
  searchUsers(query: string, limit: number, currentUserId: string): Promise<Partial<UserDto>[]>;
}
