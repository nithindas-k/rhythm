import { IUser } from '../../models/User.model';

export interface IUserRepository {
  findById(id: string): Promise<IUser | null>;
  findByIdWithSensitive(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByUsername(username: string): Promise<IUser | null>;
  findByEmailOrUsername(identifier: string): Promise<IUser | null>;
  findByGoogleId(googleId: string): Promise<IUser | null>;
  /** Find by email/username and include passwordHash + refreshTokenHashes */
  findByIdentifierWithPassword(identifier: string): Promise<IUser | null>;
  create(data: Partial<IUser>): Promise<IUser>;
  updateById(id: string, data: Partial<IUser>): Promise<IUser | null>;
  /** Push a hashed refresh token; trims oldest if over MAX_PER_USER */
  addRefreshTokenHash(userId: string, hash: string, maxTokens: number): Promise<void>;
  /** Remove a specific hashed refresh token */
  removeRefreshTokenHash(userId: string, hash: string): Promise<void>;
  /** Remove all refresh token hashes for the user (logout everywhere) */
  clearRefreshTokenHashes(userId: string): Promise<void>;
  /** Check if a hashed refresh token exists for the user */
  hasRefreshTokenHash(userId: string, hash: string): Promise<boolean>;
  deleteById(id: string): Promise<void>;
  searchByUsernameOrEmail(query: string, limit: number): Promise<IUser[]>;
  updateTheme(userId: string, theme: IUser['themePreference']): Promise<IUser | null>;
}
