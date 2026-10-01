import mongoose, { Document, Schema } from 'mongoose';

export interface IPlaylistTrack {
  songId: mongoose.Types.ObjectId;
  addedAt: Date;
  addedBy: mongoose.Types.ObjectId;
  position: number;
}

export interface IPlaylist extends Document {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  coverUrl?: string;
  isPublic: boolean;
  tracks: IPlaylistTrack[];
  trackCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const playlistTrackSchema = new Schema<IPlaylistTrack>(
  {
    songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
    addedAt: { type: Date, default: Date.now },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    position: { type: Number, required: true },
  },
  { _id: false }
);

const playlistSchema = new Schema<IPlaylist>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    coverUrl: { type: String },
    isPublic: { type: Boolean, default: false },
    tracks: { type: [playlistTrackSchema], default: [] },
    trackCount: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
playlistSchema.index({ ownerId: 1 });
playlistSchema.index({ ownerId: 1, name: 1 }, { unique: true });
playlistSchema.index({ 'tracks.songId': 1 });
playlistSchema.index({ isPublic: 1, createdAt: -1 });

export const Playlist = mongoose.model<IPlaylist>('Playlist', playlistSchema);
