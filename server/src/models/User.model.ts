import mongoose, { Document, Schema } from 'mongoose';
import { ROLES, UserRole } from '../constants/roles';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  avatarUrl?: string;
  themePreference: 'green' | 'blue' | 'purple' | 'pink' | 'orange';
  role: UserRole;
  /** Stores hashed refresh tokens (max 5 per user) */
  refreshTokenHashes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      select: false, // Never returned in queries unless explicitly projected
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    themePreference: {
      type: String,
      enum: ['green', 'blue', 'purple', 'pink', 'orange'],
      default: 'green',
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
    },
    refreshTokenHashes: {
      type: [String],
      default: [],
      select: false, // Never returned in queries unless explicitly projected
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
