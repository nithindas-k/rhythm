import { IUser } from '../models/User.model';
import { UserDto } from '../dtos/auth/auth.dto';

export function toUserDto(user: IUser): UserDto {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    themePreference: user.themePreference,
    role: user.role,
    createdAt: user.createdAt,
  };
}
