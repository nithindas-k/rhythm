import { injectable, inject } from 'tsyringe';
import { IPlaylistService } from './interfaces/IPlaylistService';
import { IPlaylistRepository } from '../repositories/interfaces/IPlaylistRepository';
import { ISongRepository } from '../repositories/interfaces/ISongRepository';
import { TOKENS } from '../container/tokens';
import { PlaylistDto } from '../dtos/song/song.dto';
import { toPlaylistDto } from '../mappers/song.mapper';
import {
  CreatePlaylistDto,
  UpdatePlaylistDto,
  AddTrackDto,
  ReorderTracksDto,
} from '../validators/playlist.validator';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../errors/index';
import { MESSAGES } from '../constants/messages';
import { PLAYLIST_LIMITS } from '../constants/limits';
import { paginate } from '../utils/paginationHelper';

@injectable()
export class PlaylistService implements IPlaylistService {
  constructor(
    @inject(TOKENS.PlaylistRepository) private playlistRepository: IPlaylistRepository,
    @inject(TOKENS.SongRepository) private songRepository: ISongRepository
  ) {}

  async list(userId: string, cursor?: string, limit = 20) {
    const raw = await this.playlistRepository.findByOwner(userId, cursor, limit + 1);
    const { items, nextCursor, hasNextPage } = paginate(
      raw as unknown as Record<string, unknown>[],
      limit
    );
    return { playlists: (items as unknown as typeof raw).map(toPlaylistDto), nextCursor, hasNextPage };
  }

  async getById(id: string, userId: string): Promise<PlaylistDto> {
    const playlist = await this.playlistRepository.findById(id);
    if (!playlist) throw new NotFoundError(MESSAGES.PLAYLIST.NOT_FOUND);
    // Allow owner or public playlists
    if (!playlist.isPublic && playlist.ownerId.toString() !== userId) {
      throw new ForbiddenError();
    }
    return toPlaylistDto(playlist);
  }

  async create(userId: string, dto: CreatePlaylistDto): Promise<PlaylistDto> {
    const existing = await this.playlistRepository.findByOwnerAndName(userId, dto.name);
    if (existing) throw new ConflictError(MESSAGES.PLAYLIST.NAME_TAKEN);

    const playlist = await this.playlistRepository.create({
      ownerId: userId as unknown as import('mongoose').Types.ObjectId,
      ...dto,
      tracks: [],
      trackCount: 0,
    });
    return toPlaylistDto(playlist);
  }

  async update(id: string, userId: string, dto: UpdatePlaylistDto): Promise<PlaylistDto> {
    const playlist = await this.playlistRepository.findById(id);
    if (!playlist) throw new NotFoundError(MESSAGES.PLAYLIST.NOT_FOUND);
    if (playlist.ownerId.toString() !== userId) throw new ForbiddenError();

    if (dto.name && dto.name !== playlist.name) {
      const existing = await this.playlistRepository.findByOwnerAndName(userId, dto.name);
      if (existing) throw new ConflictError(MESSAGES.PLAYLIST.NAME_TAKEN);
    }

    const updated = await this.playlistRepository.updateById(id, dto);
    return toPlaylistDto(updated!);
  }

  async delete(id: string, userId: string): Promise<void> {
    const playlist = await this.playlistRepository.findById(id);
    if (!playlist) throw new NotFoundError(MESSAGES.PLAYLIST.NOT_FOUND);
    if (playlist.ownerId.toString() !== userId) throw new ForbiddenError();
    await this.playlistRepository.deleteById(id);
  }

  async addTrack(playlistId: string, userId: string, dto: AddTrackDto): Promise<PlaylistDto> {
    const playlist = await this.playlistRepository.findById(playlistId);
    if (!playlist) throw new NotFoundError(MESSAGES.PLAYLIST.NOT_FOUND);
    if (playlist.ownerId.toString() !== userId) throw new ForbiddenError();
    if (playlist.trackCount >= PLAYLIST_LIMITS.MAX_TRACKS) {
      throw new ConflictError(`Playlist cannot exceed ${PLAYLIST_LIMITS.MAX_TRACKS} tracks`);
    }

    const song = await this.songRepository.findById(dto.songId);
    if (!song) throw new NotFoundError(MESSAGES.SONG.NOT_FOUND);

    const alreadyExists = await this.playlistRepository.hasSong(playlistId, dto.songId);
    if (alreadyExists) throw new ConflictError(MESSAGES.PLAYLIST.DUPLICATE_TRACK);

    const updated = await this.playlistRepository.addTrack(
      playlistId,
      dto.songId,
      userId,
      playlist.trackCount  // next position
    );
    return toPlaylistDto(updated!);
  }

  async removeTrack(playlistId: string, songId: string, userId: string): Promise<PlaylistDto> {
    const playlist = await this.playlistRepository.findById(playlistId);
    if (!playlist) throw new NotFoundError(MESSAGES.PLAYLIST.NOT_FOUND);
    if (playlist.ownerId.toString() !== userId) throw new ForbiddenError();

    const updated = await this.playlistRepository.removeTrack(playlistId, songId);
    return toPlaylistDto(updated!);
  }

  async reorderTracks(
    playlistId: string,
    userId: string,
    dto: ReorderTracksDto
  ): Promise<PlaylistDto> {
    const playlist = await this.playlistRepository.findById(playlistId);
    if (!playlist) throw new NotFoundError(MESSAGES.PLAYLIST.NOT_FOUND);
    if (playlist.ownerId.toString() !== userId) throw new ForbiddenError();

    const updated = await this.playlistRepository.reorderTracks(playlistId, dto.songIds);
    return toPlaylistDto(updated!);
  }
}
