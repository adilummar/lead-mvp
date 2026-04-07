import mongoose, { Schema, Document, Model } from 'mongoose';
import { SubTaskSchema, ISubTask } from './SubTask';

export interface ILead extends Document {
  name: string;
  contactNumber: string;
  status: 'New' | 'Contacted' | 'Proposal' | 'Negotiation' | 'Closed' | 'Lost';
  salesmanId: mongoose.Types.ObjectId;
  leadSource: 'Company' | 'Salesperson';
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
  leadSource: { type: String, enum: ['Company', 'Salesperson'], default: 'Company' },
  remarks: { type: String },
  todos: { type: [SubTaskSchema], default: [] }
}, { timestamps: true });

// Force re-registration in dev
if (process.env.NODE_ENV !== 'production') {
  delete (mongoose.models as any).Lead;
}

const Lead: Model<ILead> = mongoose.model<ILead>('Lead', LeadSchema);
export default Lead;
