import { injectable, inject } from 'tsyringe';
import { IFavoriteService } from './interfaces/IFavoriteService';
import { IFavoriteRepository } from '../repositories/interfaces/IFavoriteRepository';
import { ISongRepository } from '../repositories/interfaces/ISongRepository';
import { TOKENS } from '../container/tokens';
import { FavoriteDto } from '../dtos/song/song.dto';
import { toFavoriteDto } from '../mappers/song.mapper';
import { NotFoundError, ConflictError } from '../errors/index';
import { MESSAGES } from '../constants/messages';
import { paginate } from '../utils/paginationHelper';
import { IFavorite } from '../models/Favorite.model';
import { ISong } from '../models/Song.model';

@injectable()
export class FavoriteService implements IFavoriteService {
  constructor(
    @inject(TOKENS.FavoriteRepository) private favoriteRepository: IFavoriteRepository,
    @inject(TOKENS.SongRepository) private songRepository: ISongRepository
  ) {}

  async list(
    userId: string,
    cursor?: string,
    limit = 20
  ): Promise<{ favorites: FavoriteDto[]; nextCursor: string | null; hasNextPage: boolean }> {
    const raw = await this.favoriteRepository.findByUser(userId, cursor, limit + 1);
    const valid = raw.filter((f) => f.songId && typeof f.songId === 'object' && '_id' in (f.songId as unknown as Record<string, unknown>));

    const { items, nextCursor, hasNextPage } = paginate(
      valid as unknown as Record<string, unknown>[],
      limit
    );

    return {
      favorites: (items as unknown as (IFavorite & { songId: ISong })[]).map(toFavoriteDto),
      nextCursor,
      hasNextPage,
    };
  }

  async add(userId: string, songId: string): Promise<FavoriteDto> {
    const song = await this.songRepository.findById(songId);
    if (!song) {
      throw new NotFoundError(MESSAGES.SONG.NOT_FOUND);
    }

    const exists = await this.favoriteRepository.existsByUserAndSong(userId, songId);
    if (exists) {
      throw new ConflictError(MESSAGES.FAVORITE.ALREADY_EXISTS);
    }

    const fav = await this.favoriteRepository.create(userId, songId);
    return toFavoriteDto({
      ...fav,
      songId: song,
    } as unknown as IFavorite & { songId: ISong });
  }

  async remove(userId: string, songId: string): Promise<void> {
    const exists = await this.favoriteRepository.existsByUserAndSong(userId, songId);
    if (!exists) {
      throw new NotFoundError(MESSAGES.FAVORITE.NOT_FOUND);
    }

    await this.favoriteRepository.deleteByUserAndSong(userId, songId);
  }

  async isFavorited(userId: string, songId: string): Promise<boolean> {
    return this.favoriteRepository.existsByUserAndSong(userId, songId);
  }
}
