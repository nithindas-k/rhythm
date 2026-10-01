import { IPlaylist } from '../../models/Playlist.model';

export interface IPlaylistRepository {
  findById(id: string): Promise<IPlaylist | null>;
  findByOwner(ownerId: string, cursor?: string, limit?: number): Promise<IPlaylist[]>;
  findByOwnerAndName(ownerId: string, name: string): Promise<IPlaylist | null>;
  create(data: Partial<IPlaylist>): Promise<IPlaylist>;
  updateById(id: string, data: Partial<IPlaylist>): Promise<IPlaylist | null>;
  deleteById(id: string): Promise<void>;
  addTrack(playlistId: string, songId: string, userId: string, position: number): Promise<IPlaylist | null>;
  removeTrack(playlistId: string, songId: string): Promise<IPlaylist | null>;
  reorderTracks(playlistId: string, orderedSongIds: string[]): Promise<IPlaylist | null>;
  hasSong(playlistId: string, songId: string): Promise<boolean>;
}
