import { PlaylistDto } from '../../dtos/song/song.dto';
import {
  CreatePlaylistDto,
  UpdatePlaylistDto,
  AddTrackDto,
  ReorderTracksDto,
} from '../../validators/playlist.validator';

export interface IPlaylistService {
  list(userId: string, cursor?: string, limit?: number): Promise<{ playlists: PlaylistDto[]; nextCursor: string | null; hasNextPage: boolean }>;
  getById(id: string, userId: string): Promise<PlaylistDto>;
  create(userId: string, dto: CreatePlaylistDto): Promise<PlaylistDto>;
  update(id: string, userId: string, dto: UpdatePlaylistDto): Promise<PlaylistDto>;
  delete(id: string, userId: string): Promise<void>;
  addTrack(playlistId: string, userId: string, dto: AddTrackDto): Promise<PlaylistDto>;
  removeTrack(playlistId: string, songId: string, userId: string): Promise<PlaylistDto>;
  reorderTracks(playlistId: string, userId: string, dto: ReorderTracksDto): Promise<PlaylistDto>;
}
