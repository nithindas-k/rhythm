import { injectable } from 'tsyringe';
import mongoose from 'mongoose';
import { Playlist, IPlaylist, IPlaylistTrack } from '../models/Playlist.model';
import { IPlaylistRepository } from './interfaces/IPlaylistRepository';

@injectable()
export class PlaylistRepository implements IPlaylistRepository {
  async findById(id: string): Promise<IPlaylist | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return Playlist.findById(id).lean<IPlaylist>().exec();
  }

  async findByOwner(ownerId: string, cursor?: string, limit = 20): Promise<IPlaylist[]> {
    const filter: Record<string, unknown> = { ownerId };
    if (cursor) filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    return Playlist.find(filter)
      .select('-tracks')  // Don't load tracks on list view
      .sort({ _id: -1 })
      .limit(limit)
      .lean<IPlaylist[]>()
      .exec();
  }

  async findByOwnerAndName(ownerId: string, name: string): Promise<IPlaylist | null> {
    return Playlist.findOne({ ownerId, name }).lean<IPlaylist>().exec();
  }

  async create(data: Partial<IPlaylist>): Promise<IPlaylist> {
    const playlist = new Playlist(data);
    return (await playlist.save()).toObject() as IPlaylist;
  }

  async updateById(id: string, data: Partial<IPlaylist>): Promise<IPlaylist | null> {
    return Playlist.findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean<IPlaylist>()
      .exec();
  }

  async deleteById(id: string): Promise<void> {
    await Playlist.findByIdAndDelete(id).exec();
  }

  async addTrack(
    playlistId: string,
    songId: string,
    userId: string,
    position: number
  ): Promise<IPlaylist | null> {
    const track: IPlaylistTrack = {
      songId: new mongoose.Types.ObjectId(songId),
      addedAt: new Date(),
      addedBy: new mongoose.Types.ObjectId(userId),
      position,
    };

    return Playlist.findByIdAndUpdate(
      playlistId,
      {
        $push: { tracks: track },
        $inc: { trackCount: 1 },
      },
      { new: true }
    )
      .lean<IPlaylist>()
      .exec();
  }

  async removeTrack(playlistId: string, songId: string): Promise<IPlaylist | null> {
    return Playlist.findByIdAndUpdate(
      playlistId,
      {
        $pull: { tracks: { songId: new mongoose.Types.ObjectId(songId) } },
        $inc: { trackCount: -1 },
      },
      { new: true }
    )
      .lean<IPlaylist>()
      .exec();
  }

  async reorderTracks(
    playlistId: string,
    orderedSongIds: string[]
  ): Promise<IPlaylist | null> {
    // Fetch current tracks, then rebuild with new positions
    const playlist = await Playlist.findById(playlistId).exec();
    if (!playlist) return null;

    const trackMap = new Map(
      playlist.tracks.map((t) => [t.songId.toString(), t])
    );

    const reordered: IPlaylistTrack[] = orderedSongIds
      .map((id, index) => {
        const existing = trackMap.get(id);
        if (!existing) return null;
        return {
          songId: existing.songId,
          addedAt: existing.addedAt,
          addedBy: existing.addedBy,
          position: index,
        };
      })
      .filter((t): t is IPlaylistTrack => t !== null);

    playlist.tracks = reordered;
    await playlist.save();
    return playlist.toObject() as IPlaylist;
  }

  async hasSong(playlistId: string, songId: string): Promise<boolean> {
    const count = await Playlist.countDocuments({
      _id: playlistId,
      'tracks.songId': new mongoose.Types.ObjectId(songId),
    }).exec();
    return count > 0;
  }
}
