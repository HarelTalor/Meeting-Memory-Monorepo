import mongoose, { Document, Schema, Types } from 'mongoose';
import type { TaskStatus } from '@mm/shared-types';

export interface ITask extends Document {
  meetingId: Types.ObjectId;
  title: string;
  description?: string;
  assigneeId: Types.ObjectId;
  deadline: Date;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true, index: true },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 2000 },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'done'],
      default: 'todo',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_doc, ret) => { delete ret.__v; return ret; } },
  }
);

TaskSchema.index({ deadline: 1, status: 1 }); // For deadline watcher queries
TaskSchema.index({ assigneeId: 1, status: 1 });
TaskSchema.index({ meetingId: 1, assigneeId: 1 });

export const TaskModel = mongoose.model<ITask>('Task', TaskSchema);
