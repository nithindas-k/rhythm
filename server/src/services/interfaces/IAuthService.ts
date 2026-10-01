import { AuthResponseDto } from '../../dtos/auth/auth.dto';
import { RegisterDto, LoginDto, GoogleAuthDto } from '../../validators/auth.validator';

export interface IAuthService {
  register(dto: RegisterDto): Promise<AuthResponseDto & { refreshToken: string }>;
  login(dto: LoginDto): Promise<AuthResponseDto & { refreshToken: string }>;
  googleAuth(dto: GoogleAuthDto): Promise<AuthResponseDto & { refreshToken: string }>;
  refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
  logout(userId: string, refreshToken: string, jti: string): Promise<void>;
}
