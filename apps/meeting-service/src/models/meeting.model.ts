import mongoose, { Document, Schema, Types } from 'mongoose';
import type { MeetingPermission, MeetingStatus } from '@mm/shared-types';

export interface IMeetingParticipant {
  userId: Types.ObjectId;
  permission: MeetingPermission;
}

export interface IDecision {
  _id: Types.ObjectId;
  text: string;
  madeBy: Types.ObjectId;
  createdAt: Date;
}

export interface IMeeting extends Document {
  title: string;
  subject: string;
  date: Date;
  endDate?: Date;
  location?: string;
  organizerId: Types.ObjectId;
  participants: IMeetingParticipant[];
  guestParticipants?: string[];
  summary?: string;
  decisions: IDecision[];
  status: MeetingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IMeetingParticipant>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    permission: {
      type: String,
      enum: ['organizer', 'editor', 'viewer'],
      required: true,
      default: 'viewer',
    },
  },
  { _id: false }
);

const DecisionSchema = new Schema<IDecision>(
  {
    text: { type: String, required: true, maxlength: 1000 },
    madeBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const MeetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true, maxlength: 200 },
    subject: { type: String, required: true, maxlength: 500 },
    date: { type: Date, required: true },
    endDate: { type: Date },
    location: { type: String, maxlength: 200 },
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    participants: [ParticipantSchema],
    guestParticipants: [{ type: String }],
    summary: { type: String, maxlength: 5000 },
    decisions: [DecisionSchema],
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_doc, ret) => { delete ret.__v; return ret; } },
  }
);

// ─── Indexes for performance ───────────────────────────────────────────────────

MeetingSchema.index({ date: 1 });
MeetingSchema.index({ 'participants.userId': 1 });
MeetingSchema.index({ organizerId: 1, date: -1 });
MeetingSchema.index(
  { title: 'text', subject: 'text', summary: 'text' },
  { name: 'meeting_text_search' }
);

export const MeetingModel = mongoose.model<IMeeting>('Meeting', MeetingSchema);
