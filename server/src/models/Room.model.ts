import mongoose, { Document, Schema } from 'mongoose';

export type RoomType = 'couples' | 'party';

export interface IRoomMember {
  userId: mongoose.Types.ObjectId;
  socketId?: string;
  hasControl: boolean;
  joinedAt: Date;
}

export interface IRoomPlaybackState {
  trackId?: string;
  isPlaying: boolean;
  positionMs: number;
  serverTimestamp: number;
  version: number;
}

export interface IRoomQueueItem {
  songId: mongoose.Types.ObjectId;
  addedBy: mongoose.Types.ObjectId;
  position: number;
}

export interface IRoom extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  type: RoomType;
  hostId: mongoose.Types.ObjectId;
  members: IRoomMember[];
  playbackState: IRoomPlaybackState;
  queue: IRoomQueueItem[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema<IRoomMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    socketId: { type: String },
    hasControl: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const playbackStateSchema = new Schema<IRoomPlaybackState>(
  {
    trackId: { type: String },
    isPlaying: { type: Boolean, default: false },
    positionMs: { type: Number, default: 0 },
    serverTimestamp: { type: Number, default: () => Date.now() },
    version: { type: Number, default: 0 },
  },
  { _id: false }
);

const queueItemSchema = new Schema<IRoomQueueItem>(
  {
    songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    position: { type: Number, required: true },
  },
  { _id: false }
);

const roomSchema = new Schema<IRoom>(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    type: { type: String, enum: ['couples', 'party'], required: true },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [memberSchema], default: [] },
    playbackState: { type: playbackStateSchema, default: () => ({}) },
    queue: { type: [queueItemSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
roomSchema.index({ code: 1 }, { unique: true });
roomSchema.index({ hostId: 1 });
roomSchema.index({ isActive: 1, createdAt: -1 });
roomSchema.index({ 'members.userId': 1 });

export const Room = mongoose.model<IRoom>('Room', roomSchema);
