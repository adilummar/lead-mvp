import mongoose, { Schema, Document, Model } from 'mongoose';
import { SubTaskSchema, ISubTask } from './SubTask';

export interface ICompanyGoal extends Document {
  title: string;
  description?: string;
  deadline?: Date;
  subtasks: ISubTask[];
  priority: 'High' | 'Medium' | 'Low';
}

const CompanyGoalSchema = new Schema<ICompanyGoal>({
  title: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date },
  subtasks: { type: [SubTaskSchema], default: [] },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], required: true, default: 'Medium' }
});

const CompanyGoal: Model<ICompanyGoal> = mongoose.models.CompanyGoal || mongoose.model<ICompanyGoal>('CompanyGoal', CompanyGoalSchema);
export default CompanyGoal;
