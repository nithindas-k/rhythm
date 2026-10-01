import mongoose, { Document, Schema } from 'mongoose';

export type FriendStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface IFriend extends Document {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  status: FriendStatus;
  createdAt: Date;
  updatedAt: Date;
}

const friendSchema = new Schema<IFriend>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'blocked'],
      default: 'pending',
    },
  },
  { timestamps: true, versionKey: false }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Unique compound: prevents duplicate requests in either direction
friendSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
// Incoming requests for a user
friendSchema.index({ receiverId: 1, status: 1 });
// Outgoing requests from a user
friendSchema.index({ senderId: 1, status: 1 });
// General status + date for admin queries
friendSchema.index({ status: 1, updatedAt: -1 });

export const Friend = mongoose.model<IFriend>('Friend', friendSchema);
