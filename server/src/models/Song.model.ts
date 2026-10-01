import mongoose, { Document, Schema } from 'mongoose';

export type MusicProvider = 'jiosaavn' | 's3';

export interface ISong extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  durationMs: number;
  coverUrl?: string;
  audioUrl: string;
  previewUrl?: string;   // Low-bitrate preview URL
  permaUrl?: string;     // JioSaavn song page URL
  provider: MusicProvider;
  providerId: string;
  playCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const songSchema = new Schema<ISong>(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    album: { type: String, trim: true },
    genre: { type: String, trim: true },
    durationMs: { type: Number, required: true },
    coverUrl: { type: String },
    audioUrl: { type: String, required: true },
    previewUrl: { type: String },
    permaUrl: { type: String },
    provider: { type: String, enum: ['jiosaavn', 's3'], required: true },
    providerId: { type: String, required: true },
    playCount: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
songSchema.index({ title: 'text', artist: 'text', album: 'text' });
songSchema.index({ genre: 1 });
songSchema.index({ playCount: -1 });
songSchema.index({ provider: 1, providerId: 1 }, { unique: true });

export const Song = mongoose.model<ISong>('Song', songSchema);
