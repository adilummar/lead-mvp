import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  contact?: string;
  phone?: string;
  country?: string;
  role: 'Admin' | 'Sales';
  bio?: string;
  avatarUrl?: string;
  designation?: string;
  isOwner: boolean;
  joinedAt: Date;
  analytics: {
    totalLeads: number;
    convertedLeads: number;
  };
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contact: { type: String },
  phone: { type: String },
  country: { type: String },
  role: { type: String, enum: ['Admin', 'Sales'], required: true, default: 'Sales' },
  bio: { type: String },
  avatarUrl: { type: String },
  designation: { type: String },
  isOwner: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
  analytics: {
    totalLeads: { type: Number, default: 0 },
    convertedLeads: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Force re-registration in dev so schema changes apply on hot-reload
if (process.env.NODE_ENV !== 'production') {
  delete (mongoose.models as any).User;
}

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export default User;
