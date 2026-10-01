import { FavoriteDto } from '../../dtos/song/song.dto';

export interface IFavoriteService {
  list(userId: string, cursor?: string, limit?: number): Promise<{ favorites: FavoriteDto[]; nextCursor: string | null; hasNextPage: boolean }>;
  add(userId: string, songId: string): Promise<FavoriteDto>;
  remove(userId: string, songId: string): Promise<void>;
  isFavorited(userId: string, songId: string): Promise<boolean>;
}
