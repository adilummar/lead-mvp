import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivityLog extends Document {
  entityType: 'Lead' | 'Project' | 'Goal' | 'Finance' | 'Team' | 'Todo';
  entityId: mongoose.Types.ObjectId;
  entityName: string;
  action: string;
  message: string;
  meta?: Record<string, any>;
  performedBy?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  entityType: {
    type: String,
    enum: ['Lead', 'Project', 'Goal', 'Finance', 'Team', 'Todo'],
    required: true,
    index: true,
  },
  entityId: { type: Schema.Types.ObjectId, required: true, index: true },
  entityName: { type: String, required: true },
  action: { type: String, required: true },
  message: { type: String, required: true },
  meta: { type: Schema.Types.Mixed },
  performedBy: { type: String, default: 'Admin' },
}, { timestamps: true });

// Compound indexes for efficient querying
ActivityLogSchema.index({ entityType: 1, entityId: 1 });
ActivityLogSchema.index({ entityType: 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: -1 });

if (process.env.NODE_ENV !== 'production') {
  delete (mongoose.models as any).ActivityLog;
}

const ActivityLog: Model<IActivityLog> = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
export default ActivityLog;
