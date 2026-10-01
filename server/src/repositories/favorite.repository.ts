import { injectable } from 'tsyringe';
import mongoose from 'mongoose';
import { Favorite, IFavorite } from '../models/Favorite.model';
import { IFavoriteRepository } from './interfaces/IFavoriteRepository';

@injectable()
export class FavoriteRepository implements IFavoriteRepository {
  async findByUserAndSong(userId: string, songId: string): Promise<IFavorite | null> {
    return Favorite.findOne({ userId, songId }).lean<IFavorite>().exec();
  }

  async findByUser(userId: string, cursor?: string, limit = 20): Promise<IFavorite[]> {
    const filter: Record<string, unknown> = { userId };
    if (cursor) filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };

    return Favorite.find(filter)
      .populate('songId')    // Populate full song details
      .sort({ _id: -1 })
      .limit(limit)
      .lean<IFavorite[]>()
      .exec();
  }

  async create(userId: string, songId: string): Promise<IFavorite> {
    const fav = new Favorite({ userId, songId });
    return (await fav.save()).toObject() as IFavorite;
  }

  async deleteByUserAndSong(userId: string, songId: string): Promise<void> {
    await Favorite.findOneAndDelete({ userId, songId }).exec();
  }

  async existsByUserAndSong(userId: string, songId: string): Promise<boolean> {
    const count = await Favorite.countDocuments({ userId, songId }).exec();
    return count > 0;
  }
}
