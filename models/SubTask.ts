import { Schema } from 'mongoose';

export interface ISubTask {
  taskName: string;
  isCompleted: boolean;
  dueDate?: Date;
  priority: 'High' | 'Medium' | 'Low';
  assignedToDay: 'Today' | 'Tomorrow' | 'Later';
  addedToTodo: boolean; // Only true when user explicitly schedules it into Master Todo
}

export const SubTaskSchema = new Schema<ISubTask>({
  taskName: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  dueDate: { type: Date },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], required: true, default: 'Medium' },
  assignedToDay: { type: String, enum: ['Today', 'Tomorrow', 'Later'], required: true, default: 'Later' },
  addedToTodo: { type: Boolean, default: false },
});
