import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeadActivity extends Document {
  leadId: mongoose.Types.ObjectId;
  message: string;
  type: 'Note' | 'Call' | 'TaskDone' | 'StatusChange';
  createdAt: Date;
}

const LeadActivitySchema = new Schema<ILeadActivity>({
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['Note', 'Call', 'TaskDone', 'StatusChange'], required: true, default: 'Note' },
}, { timestamps: true });

// Force re-registration in dev
if (process.env.NODE_ENV !== 'production') {
  delete (mongoose.models as any).LeadActivity;
}

const LeadActivity: Model<ILeadActivity> = mongoose.model<ILeadActivity>('LeadActivity', LeadActivitySchema);
export default LeadActivity;
