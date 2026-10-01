import { IFavorite } from '../../models/Favorite.model';

export interface IFavoriteRepository {
  findByUserAndSong(userId: string, songId: string): Promise<IFavorite | null>;
  findByUser(userId: string, cursor?: string, limit?: number): Promise<IFavorite[]>;
  create(userId: string, songId: string): Promise<IFavorite>;
  deleteByUserAndSong(userId: string, songId: string): Promise<void>;
  existsByUserAndSong(userId: string, songId: string): Promise<boolean>;
}
