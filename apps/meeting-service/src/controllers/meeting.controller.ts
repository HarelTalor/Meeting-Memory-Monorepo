import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { MeetingModel } from '../models/meeting.model';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '@mm/problem-details';
import {
  buildPaginationMeta,
  toSkip,
  stripUndefined,
  sanitizeSearchQuery,
} from '@mm/shared-utils';
import type {
  CreateMeetingDto,
  UpdateMeetingDto,
  MeetingQuery,
  AddParticipantDto,
  UpdateParticipantDto,
  AddDecisionDto,
} from '@mm/shared-types';
import type { AuthRequest } from '../middleware/auth.middleware';

// ─── List meetings ─────────────────────────────────────────────────────────────

export const listMeetings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const q = req.query as unknown as MeetingQuery;
    const { page, limit, search, dateFrom, dateTo, participantId, status, sortBy, sortOrder } = q;

    const filter: Record<string, unknown> = {};
    const conditions: Record<string, unknown>[] = [
      { $or: [{ organizerId: userId }, { 'participants.userId': userId }] }
    ];

    if (status) filter['status'] = status;
    if (participantId) filter['participants.userId'] = participantId;
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter['$gte'] = new Date(dateFrom);
      if (dateTo) dateFilter['$lte'] = new Date(dateTo);
      filter['date'] = dateFilter;
    }
    if (search) {
      const sanitized = sanitizeSearchQuery(search);
      conditions.push({
        $or: [
          { title: { $regex: sanitized, $options: 'i' } },
          { subject: { $regex: sanitized, $options: 'i' } },
          { summary: { $regex: sanitized, $options: 'i' } },
          { guestParticipants: { $regex: sanitized, $options: 'i' } }
        ]
      });
    }

    if (conditions.length > 0) {
      filter['$and'] = conditions;
    }

    const sort: Record<string, 1 | -1> = { [sortBy ?? 'date']: sortOrder === 'asc' ? 1 : -1 };
    const skip = toSkip(page ?? 1, limit ?? 20);

    const [data, total] = await Promise.all([
      MeetingModel.find(filter).sort(sort).skip(skip).limit(limit ?? 20).lean(),
      MeetingModel.countDocuments(filter),
    ]);

    res.json(buildPaginationMeta(data, total, { page: page ?? 1, limit: limit ?? 20 }));
  } catch (err) {
    next(err);
  }
};

// ─── Get one meeting ──────────────────────────────────────────────────────────

export const getMeeting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const meeting = await MeetingModel.findById(req.params['id']).lean();
    if (!meeting) throw new NotFoundError('Meeting', req.params['id']);

    const isParticipant =
      meeting.organizerId.toString() === userId ||
      meeting.participants.some((p) => p.userId.toString() === userId);

    if (!isParticipant) throw new ForbiddenError('You are not a participant of this meeting');

    res.json(meeting);
  } catch (err) {
    next(err);
  }
};

// ─── Create meeting ───────────────────────────────────────────────────────────

export const createMeeting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const dto = req.body as CreateMeetingDto;

    const meeting = await MeetingModel.create({
      ...dto,
      organizerId: userId,
      date: new Date(dto.date),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      participants: [
        { userId, permission: 'organizer' },
        ...(dto.participantIds ?? []).map((p) => ({
          userId: p.userId,
          permission: p.permission ?? 'viewer',
        })),
      ],
      guestParticipants: dto.guestParticipants,
      decisions: (dto.decisions ?? []).map((text) => ({
        _id: new mongoose.Types.ObjectId(),
        text,
        madeBy: userId,
        createdAt: new Date(),
      })),
    });

    res.status(201).json(meeting.toJSON());
  } catch (err) {
    next(err);
  }
};

// ─── Update meeting ───────────────────────────────────────────────────────────

export const updateMeeting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const meeting = await MeetingModel.findById(req.params['id']);
    if (!meeting) throw new NotFoundError('Meeting', req.params['id']);

    const participant = meeting.participants.find((p) => p.userId.toString() === userId);
    const isOrganizer = meeting.organizerId.toString() === userId;
    const canEdit = isOrganizer || participant?.permission === 'editor';
    if (!canEdit) throw new ForbiddenError('Only editors and organizers can update this meeting');

    const dto = req.body as UpdateMeetingDto;
    const updates = stripUndefined({
      title: dto.title,
      subject: dto.subject,
      date: dto.date ? new Date(dto.date) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      location: dto.location,
      summary: dto.summary,
      status: dto.status,
      guestParticipants: dto.guestParticipants,
    } as Record<string, unknown>);

    if (dto.decisions) {
      updates['decisions'] = dto.decisions.map((text) => ({
        _id: new mongoose.Types.ObjectId(),
        text,
        madeBy: userId,
        createdAt: new Date(),
      }));
    }

    const updated = await MeetingModel.findByIdAndUpdate(
      req.params['id'],
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json(updated?.toJSON());
  } catch (err) {
    next(err);
  }
};

// ─── Delete meeting ───────────────────────────────────────────────────────────

export const deleteMeeting = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const meeting = await MeetingModel.findById(req.params['id']);
    if (!meeting) throw new NotFoundError('Meeting', req.params['id']);

    if (meeting.organizerId.toString() !== userId)
      throw new ForbiddenError('Only the organizer can delete this meeting');

    await meeting.deleteOne();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// ─── Participant management ───────────────────────────────────────────────────

export const addParticipant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const meeting = await MeetingModel.findById(req.params['id']);
    if (!meeting) throw new NotFoundError('Meeting', req.params['id']);

    if (meeting.organizerId.toString() !== userId)
      throw new ForbiddenError('Only the organizer can add participants');

    const dto = req.body as AddParticipantDto;
    const already = meeting.participants.some((p) => p.userId.toString() === dto.userId);
    if (already) throw new BadRequestError('User is already a participant');

    meeting.participants.push({ userId: new mongoose.Types.ObjectId(dto.userId), permission: dto.permission });
    await meeting.save();

    res.status(201).json(meeting.toJSON());
  } catch (err) {
    next(err);
  }
};

export const updateParticipant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const meeting = await MeetingModel.findById(req.params['id']);
    if (!meeting) throw new NotFoundError('Meeting', req.params['id']);

    if (meeting.organizerId.toString() !== userId)
      throw new ForbiddenError('Only the organizer can change permissions');

    const dto = req.body as UpdateParticipantDto;
    const participant = meeting.participants.find((p) => p.userId.toString() === req.params['userId']);
    if (!participant) throw new NotFoundError('Participant', req.params['userId']);

    participant.permission = dto.permission;
    await meeting.save();

    res.json(meeting.toJSON());
  } catch (err) {
    next(err);
  }
};

export const removeParticipant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const meeting = await MeetingModel.findById(req.params['id']);
    if (!meeting) throw new NotFoundError('Meeting', req.params['id']);

    if (meeting.organizerId.toString() !== userId)
      throw new ForbiddenError('Only the organizer can remove participants');

    const targetId = req.params['userId'];
    if (targetId === userId) throw new BadRequestError('Organizer cannot remove themselves');

    meeting.participants = meeting.participants.filter((p) => p.userId.toString() !== targetId) as typeof meeting.participants;
    await meeting.save();

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// ─── Decision management ──────────────────────────────────────────────────────

export const addDecision = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const meeting = await MeetingModel.findById(req.params['id']);
    if (!meeting) throw new NotFoundError('Meeting', req.params['id']);

    const participant = meeting.participants.find((p) => p.userId.toString() === userId);
    const canEdit = meeting.organizerId.toString() === userId || participant?.permission === 'editor';
    if (!canEdit) throw new ForbiddenError('Only editors and organizers can add decisions');

    const dto = req.body as AddDecisionDto;
    meeting.decisions.push({
      _id: new mongoose.Types.ObjectId(),
      text: dto.text,
      madeBy: new mongoose.Types.ObjectId(userId),
      createdAt: new Date(),
    });
    await meeting.save();

    res.status(201).json(meeting.toJSON());
  } catch (err) {
    next(err);
  }
};

export const removeDecision = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const meeting = await MeetingModel.findById(req.params['id']);
    if (!meeting) throw new NotFoundError('Meeting', req.params['id']);

    if (meeting.organizerId.toString() !== userId)
      throw new ForbiddenError('Only the organizer can remove decisions');

    meeting.decisions = meeting.decisions.filter(
      (d) => d._id.toString() !== req.params['decisionId']
    ) as typeof meeting.decisions;
    await meeting.save();

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
