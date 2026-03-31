import mongoose, { Schema, Document, Model } from 'mongoose';
import { SubTaskSchema, ISubTask } from './SubTask';

export interface IProject extends Document {
  leadId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: 'Planned' | 'In-Progress' | 'Testing' | 'Completed' | 'Maintenance';
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Fully Paid';
  totalBudget: number;
  amountPaid: number;
  expenses: { amount: number; desc: string }[];
  salesmanId?: mongoose.Types.ObjectId;
  tasks: ISubTask[];
}

const ProjectSchema = new Schema<IProject>({
  leadId:        { type: Schema.Types.ObjectId, ref: 'Lead', required: false },
  title:         { type: String, required: true },
  description:   { type: String },
  status:        { type: String, enum: ['Planned', 'In-Progress', 'Testing', 'Completed', 'Maintenance'], required: true, default: 'Planned' },
  paymentStatus: { type: String, enum: ['Unpaid', 'Partially Paid', 'Fully Paid'], required: true, default: 'Unpaid' },
  totalBudget:   { type: Number, required: true, default: 0 },
  amountPaid:    { type: Number, required: true, default: 0 },
  expenses:      [{ amount: { type: Number, required: true }, desc: { type: String, required: true } }],
  salesmanId:    { type: Schema.Types.ObjectId, ref: 'User', required: false },
  tasks:         { type: [SubTaskSchema], default: [] },
}, { timestamps: true });

// Force re-registration in dev so schema changes apply on hot-reload
if (process.env.NODE_ENV !== 'production') {
  delete (mongoose.models as any).Project;
}

const Project: Model<IProject> = mongoose.model<IProject>('Project', ProjectSchema);
export default Project;
