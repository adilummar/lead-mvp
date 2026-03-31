import mongoose, { Schema, Document, Model } from 'mongoose';
import { SubTaskSchema, ISubTask } from './SubTask';

export interface ILead extends Document {
  name: string;
  contactNumber: string;
  status: 'New' | 'Contacted' | 'Proposal' | 'Negotiation' | 'Closed' | 'Lost';
  salesmanId: mongoose.Types.ObjectId;
  remarks?: string;
  todos: ISubTask[];
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>({
  name: { type: String, required: true },
  contactNumber: { type: String, required: true },
  status: { type: String, enum: ['New', 'Contacted', 'Proposal', 'Negotiation', 'Closed', 'Lost'], required: true, default: 'New' },
  salesmanId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  remarks: { type: String },
  todos: { type: [SubTaskSchema], default: [] }
}, { timestamps: true });

const Lead: Model<ILead> = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
export default Lead;
