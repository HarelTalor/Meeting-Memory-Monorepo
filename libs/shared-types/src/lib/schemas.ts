import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const MeetingPermissionSchema = z.enum(['organizer', 'editor', 'viewer']);
export type MeetingPermission = z.infer<typeof MeetingPermissionSchema>;

export const MeetingStatusSchema = z.enum(['scheduled', 'completed', 'cancelled']);
export type MeetingStatus = z.infer<typeof MeetingStatusSchema>;

export const TaskStatusSchema = z.enum(['todo', 'in-progress', 'done']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const NotificationTypeSchema = z.enum([
  'meeting_reminder',
  'task_deadline',
  'participant_added',
  'meeting_updated',
  'task_assigned',
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

// ─── User Schemas ─────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50),
});
export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  avatarUrl: z.string().url().optional(),
});
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

export const UserSchema = z.object({
  _id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  avatarUrl: z.string().url().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: UserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// ─── Meeting Schemas ──────────────────────────────────────────────────────────

export const MeetingParticipantSchema = z.object({
  userId: z.string(),
  permission: MeetingPermissionSchema,
  displayName: z.string().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});
export type MeetingParticipant = z.infer<typeof MeetingParticipantSchema>;

export const DecisionSchema = z.object({
  _id: z.string(),
  text: z.string().min(1, 'Decision text is required').max(1000),
  madeBy: z.string(),
  createdAt: z.string().datetime(),
});
export type Decision = z.infer<typeof DecisionSchema>;

export const CreateMeetingSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  subject: z.string().min(2, 'Subject is required').max(500),
  date: z.string().datetime('Invalid date format'),
  endDate: z.string().datetime('Invalid end date format').optional(),
  location: z.string().max(200).optional(),
  summary: z.string().max(5000).optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
  decisions: z.array(z.string()).optional().default([]),
  guestParticipants: z.array(z.string()).optional().default([]),
  participantIds: z
    .array(
      z.object({
        userId: z.string(),
        permission: MeetingPermissionSchema.default('viewer'),
      })
    )
    .optional()
    .default([]),
});
export type CreateMeetingDto = z.infer<typeof CreateMeetingSchema>;

export const UpdateMeetingSchema = CreateMeetingSchema.partial().extend({
  status: MeetingStatusSchema.optional(),
  decisions: z.array(z.string()).optional(),
});
export type UpdateMeetingDto = z.infer<typeof UpdateMeetingSchema>;

export const MeetingSchema = z.object({
  _id: z.string(),
  title: z.string(),
  subject: z.string(),
  date: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  location: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  status: MeetingStatusSchema,
  decisions: z.array(DecisionSchema),
  guestParticipants: z.array(z.string()).optional().default([]),
  organizerId: z.string(),
  participants: z.array(MeetingParticipantSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Meeting = z.infer<typeof MeetingSchema>;

export const AddParticipantSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  permission: MeetingPermissionSchema.default('viewer'),
});
export type AddParticipantDto = z.infer<typeof AddParticipantSchema>;

export const UpdateParticipantSchema = z.object({
  permission: MeetingPermissionSchema,
});
export type UpdateParticipantDto = z.infer<typeof UpdateParticipantSchema>;

export const AddDecisionSchema = z.object({
  text: z.string().min(1, 'Decision text is required').max(1000),
});
export type AddDecisionDto = z.infer<typeof AddDecisionSchema>;

export const MeetingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  search: z.string().max(200).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  participantId: z.string().optional(),
  status: MeetingStatusSchema.optional(),
  sortBy: z.enum(['date', 'createdAt', 'title']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type MeetingQuery = z.infer<typeof MeetingQuerySchema>;

// ─── Task Schemas ─────────────────────────────────────────────────────────────

export const CreateTaskSchema = z.object({
  meetingId: z.string().min(1, 'Meeting ID is required'),
  title: z.string().min(2, 'Task title is required').max(200),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().min(1, 'Assignee is required'),
  deadline: z.string().datetime('Invalid deadline format'),
});
export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().optional(),
  deadline: z.string().datetime().optional(),
  status: TaskStatusSchema.optional(),
});
export type UpdateTaskDto = z.infer<typeof UpdateTaskSchema>;

export const TaskSchema = z.object({
  _id: z.string(),
  meetingId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  assigneeId: z.string(),
  assignee: UserSchema.optional(),
  deadline: z.string().datetime(),
  status: TaskStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Task = z.infer<typeof TaskSchema>;

export const TaskQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  meetingId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: TaskStatusSchema.optional(),
  deadlineBefore: z.string().datetime().optional(),
  deadlineAfter: z.string().datetime().optional(),
});
export type TaskQuery = z.infer<typeof TaskQuerySchema>;

// ─── Notification Schemas ─────────────────────────────────────────────────────

export const NotificationSchema = z.object({
  _id: z.string(),
  recipientId: z.string(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  payload: z.record(z.string(), z.unknown()).optional(),
  read: z.boolean().default(false),
  createdAt: z.string().datetime(),
});
export type Notification = z.infer<typeof NotificationSchema>;

// ─── Pagination ────────────────────────────────────────────────────────────────

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
