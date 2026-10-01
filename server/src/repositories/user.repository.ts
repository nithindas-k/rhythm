import { injectable } from 'tsyringe';
import { IUser, User } from '../models/User.model';
import { IUserRepository } from './interfaces/IUserRepository';

@injectable()
export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id).lean<IUser>().exec();
  }

  async findByIdWithSensitive(id: string): Promise<IUser | null> {
    return User.findById(id)
      .select('+passwordHash +refreshTokenHashes')
      .lean<IUser>()
      .exec();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).lean<IUser>().exec();
  }

  async findByUsername(username: string): Promise<IUser | null> {
    return User.findOne({ username }).lean<IUser>().exec();
  }

  async findByEmailOrUsername(identifier: string): Promise<IUser | null> {
    return User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
    })
      .lean<IUser>()
      .exec();
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ googleId }).lean<IUser>().exec();
  }

  async findByIdentifierWithPassword(identifier: string): Promise<IUser | null> {
    return User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
    })
      .select('+passwordHash +refreshTokenHashes')
      .lean<IUser>()
      .exec();
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    const user = new User(data);
    return (await user.save()).toObject() as IUser;
  }

  async updateById(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean<IUser>()
      .exec();
  }

  async addRefreshTokenHash(
    userId: string,
    hash: string,
    maxTokens: number
  ): Promise<void> {
    // Push new hash; trim array from the front if over limit
    await User.findByIdAndUpdate(userId, {
      $push: {
        refreshTokenHashes: {
          $each: [hash],
          $slice: -maxTokens, // Keep only the latest N tokens
        },
      },
    }).exec();
  }

  async removeRefreshTokenHash(userId: string, hash: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokenHashes: hash },
    }).exec();
  }

  async clearRefreshTokenHashes(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $set: { refreshTokenHashes: [] },
    }).exec();
  }

  async hasRefreshTokenHash(userId: string, hash: string): Promise<boolean> {
    const count = await User.countDocuments({
      _id: userId,
      refreshTokenHashes: hash,
    }).exec();
    return count > 0;
  }

  async deleteById(id: string): Promise<void> {
    await User.findByIdAndDelete(id).exec();
  }

  async searchByUsernameOrEmail(query: string, limit: number): Promise<IUser[]> {
    const regex = new RegExp(query, 'i');
    return User.find({
      $or: [{ username: regex }, { email: regex }],
    })
      .limit(limit)
      .select('username email avatarUrl')
      .lean<IUser[]>()
      .exec();
  }

  async updateTheme(
    userId: string,
    theme: IUser['themePreference']
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      { $set: { themePreference: theme } },
      { new: true }
    )
      .lean<IUser>()
      .exec();
  }
}
