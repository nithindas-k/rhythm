import { injectable, inject } from 'tsyringe';
import { IUserService } from './interfaces/IUserService';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { TOKENS } from '../container/tokens';
import { UserDto } from '../dtos/auth/auth.dto';
import { toUserDto } from '../mappers/user.mapper';
import { UpdateProfileDto, UpdateThemeDto } from '../validators/user.validator';
import { NotFoundError, ConflictError } from '../errors/index';
import { MESSAGES } from '../constants/messages';

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TOKENS.UserRepository) private userRepository: IUserRepository
  ) {}

  async getProfile(userId: string): Promise<UserDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError(MESSAGES.USER.NOT_FOUND);
    return toUserDto(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserDto> {
    // Check username uniqueness if changing it
    if (dto.username) {
      const existing = await this.userRepository.findByUsername(dto.username);
      if (existing && existing._id.toString() !== userId) {
        throw new ConflictError(MESSAGES.AUTH.USERNAME_TAKEN);
      }
    }

    const updated = await this.userRepository.updateById(userId, dto);
    if (!updated) throw new NotFoundError(MESSAGES.USER.NOT_FOUND);
    return toUserDto(updated);
  }

  async updateTheme(userId: string, dto: UpdateThemeDto): Promise<UserDto> {
    const updated = await this.userRepository.updateTheme(userId, dto.theme);
    if (!updated) throw new NotFoundError(MESSAGES.USER.NOT_FOUND);
    return toUserDto(updated);
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError(MESSAGES.USER.NOT_FOUND);
    await this.userRepository.deleteById(userId);
  }

  async searchUsers(
    query: string,
    limit: number,
    currentUserId: string
  ): Promise<Partial<UserDto>[]> {
    const users = await this.userRepository.searchByUsernameOrEmail(query, limit + 1);
    // Filter out the requesting user
    return users
      .filter((u) => u._id.toString() !== currentUserId)
      .slice(0, limit)
      .map((u) => ({
        id: u._id.toString(),
        username: u.username,
        avatarUrl: u.avatarUrl ?? null,
      }));
  }
}
