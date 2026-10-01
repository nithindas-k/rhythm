import mongoose, { Document, Schema } from 'mongoose';

export interface IFavorite extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  songId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
favoriteSchema.index({ userId: 1, songId: 1 }, { unique: true });
favoriteSchema.index({ userId: 1, createdAt: -1 });

export const Favorite = mongoose.model<IFavorite>('Favorite', favoriteSchema);
