import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProjectUpdate extends Document {
  projectId: mongoose.Types.ObjectId;
  message: string;
  type: 'Manual' | 'TaskDone';
  date: Date;
  taskName?: string;
  createdAt: Date;
}

const ProjectUpdateSchema = new Schema<IProjectUpdate>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['Manual', 'TaskDone'], required: true, default: 'Manual' },
  date: { type: Date, required: true, default: Date.now },
  taskName: { type: String },
}, { timestamps: true });

// Force re-registration in dev
if (process.env.NODE_ENV !== 'production') {
  delete (mongoose.models as any).ProjectUpdate;
}

const ProjectUpdate: Model<IProjectUpdate> = mongoose.model<IProjectUpdate>('ProjectUpdate', ProjectUpdateSchema);
export default ProjectUpdate;
