import { injectable, inject } from 'tsyringe';
import { ISongService } from './interfaces/ISongService';
import { ISongRepository } from '../repositories/interfaces/ISongRepository';
import { IMusicProvider } from './interfaces/IMusicProvider';
import { TOKENS } from '../container/tokens';
import { SongDto } from '../dtos/song/song.dto';
import { toSongDto } from '../mappers/song.mapper';
import { SongSearchDto } from '../validators/song.validator';
import { NotFoundError } from '../errors/index';
import { MESSAGES } from '../constants/messages';
import { paginate } from '../utils/paginationHelper';

@injectable()
export class SongService implements ISongService {
  constructor(
    @inject(TOKENS.SongRepository) private songRepository: ISongRepository,
    @inject(TOKENS.MusicProvider) private musicProvider: IMusicProvider
  ) {}

  async search(dto: SongSearchDto): Promise<{ songs: SongDto[]; nextCursor: string | null; hasNextPage: boolean }> {
    const limit = dto.limit ?? 20;

    // 1. If text search query, call JioSaavn provider directly
    if (dto.q && dto.q.trim().length > 0) {
      try {
        const providerTracks = await this.musicProvider.searchTracks(dto.q.trim(), limit);
        if (providerTracks && providerTracks.length > 0) {
          // Look up any already-persisted MongoDB docs so we return stable IDs
          const providerIds = providerTracks.map((t) => t.providerId);
          const mongoDocs = await this.songRepository.findManyByProviderIds(providerIds);
          const docMap = new Map(mongoDocs.map((d) => [d.providerId, d]));

          const songs: SongDto[] = await Promise.all(
            providerTracks.map(async (t) => {
              const existingDoc = docMap.get(t.providerId);
              if (existingDoc) return toSongDto(existingDoc);
              try {
                const newDoc = await this.songRepository.upsertByProvider({
                  title: t.title,
                  artist: t.artist,
                  album: t.album,
                  genre: t.genre,
                  durationMs: t.durationMs,
                  coverUrl: t.coverUrl,
                  audioUrl: t.audioUrl,
                  previewUrl: t.previewUrl,
                  permaUrl: t.permaUrl,
                  provider: t.provider,
                  providerId: t.providerId,
                });
                return toSongDto(newDoc);
              } catch {
                return {
                  id: t.providerId,
                  title: t.title,
                  artist: t.artist,
                  album: t.album,
                  genre: t.genre,
                  durationMs: t.durationMs,
                  coverUrl: t.coverUrl,
                  audioUrl: t.audioUrl,
                  previewUrl: t.previewUrl,
                  permaUrl: t.permaUrl,
                  provider: t.provider,
                  playCount: 0,
                };
              }
            })
          );

          return { songs, nextCursor: null, hasNextPage: false };
        }
      } catch {
        // Fall back to MongoDB full-text index
      }
    }

    const raw = await this.songRepository.search({ ...dto, limit: limit + 1 });
    const { items, nextCursor, hasNextPage } = paginate(
      raw as unknown as Record<string, unknown>[],
      limit,
      dto.sort === 'trending' ? 'playCount' : '_id'
    );
    return { songs: (items as unknown as typeof raw).map(toSongDto), nextCursor, hasNextPage };
  }

  async getById(id: string): Promise<SongDto> {
    // 1. Check MongoDB by _id first
    let song = await this.songRepository.findById(id);

    // 2. Check by providerId (JioSaavn song id)
    if (!song) {
      song = await this.songRepository.findByProviderId('jiosaavn', id);
    }

    // 3. Fetch from JioSaavn and persist
    if (!song) {
      const providerTrack = await this.musicProvider.getTrackById(id);
      if (providerTrack) {
        song = await this.songRepository.upsertByProvider({
          title: providerTrack.title,
          artist: providerTrack.artist,
          album: providerTrack.album,
          genre: providerTrack.genre || 'Music',
          durationMs: providerTrack.durationMs,
          coverUrl: providerTrack.coverUrl,
          audioUrl: providerTrack.audioUrl,
          previewUrl: providerTrack.previewUrl,
          permaUrl: providerTrack.permaUrl,
          provider: providerTrack.provider,
          providerId: providerTrack.providerId,
        });
      }
    }

    if (!song) throw new NotFoundError(MESSAGES.SONG.NOT_FOUND);
    return toSongDto(song);
  }

  async getTrending(limit: number): Promise<SongDto[]> {
    const songs = await this.songRepository.findTrending(limit);
    return songs.map(toSongDto);
  }

  async recordPlay(id: string): Promise<void> {
    const song = await this.songRepository.findById(id);
    if (!song) throw new NotFoundError(MESSAGES.SONG.NOT_FOUND);
    await this.songRepository.incrementPlayCount(id);
  }
}
