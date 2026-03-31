import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  contact?: string;
  country?: string;
  role: 'Admin' | 'Sales';
  analytics: {
    totalLeads: number;
    convertedLeads: number;
  };
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contact: { type: String },
  country: { type: String },
  role: { type: String, enum: ['Admin', 'Sales'], required: true, default: 'Sales' },
  analytics: {
    totalLeads: { type: Number, default: 0 },
    convertedLeads: { type: Number, default: 0 }
  }
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
