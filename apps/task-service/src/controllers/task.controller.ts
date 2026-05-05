import type { Request, Response, NextFunction } from 'express';
import { TaskModel } from '../models/task.model';
import { NotFoundError, ForbiddenError } from '@mm/problem-details';
import { buildPaginationMeta, toSkip, stripUndefined } from '@mm/shared-utils';
import type { CreateTaskDto, UpdateTaskDto, TaskQuery } from '@mm/shared-types';
import type { AuthRequest } from '../middleware/auth.middleware';

export const listTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const q = req.query as unknown as TaskQuery;
    const { page = 1, limit = 20, meetingId, assigneeId, status, deadlineBefore, deadlineAfter } = q;

    const filter: Record<string, unknown> = {};
    
    // Default security: only show tasks assigned to user or in meetings they are part of
    // For now, if no meetingId is specified, restrict to assigneeId = userId
    if (!meetingId && !assigneeId) {
      filter['assigneeId'] = userId;
    }

    if (meetingId) filter['meetingId'] = meetingId;
    if (assigneeId) filter['assigneeId'] = assigneeId;
    if (status) filter['status'] = status;
    if (deadlineBefore || deadlineAfter) {
      const dl: Record<string, Date> = {};
      if (deadlineBefore) dl['$lte'] = new Date(deadlineBefore);
      if (deadlineAfter) dl['$gte'] = new Date(deadlineAfter);
      filter['deadline'] = dl;
    }

    const skip = toSkip(page, limit);
    const [data, total] = await Promise.all([
      TaskModel.find(filter).sort({ deadline: 1 }).skip(skip).limit(limit).lean(),
      TaskModel.countDocuments(filter),
    ]);

    res.json(buildPaginationMeta(data, total, { page, limit }));
  } catch (err) {
    next(err);
  }
};

export const getTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const task = await TaskModel.findById(req.params['id']).lean();
    if (!task) throw new NotFoundError('Task', req.params['id']);
    if (task.assigneeId.toString() !== userId)
      throw new ForbiddenError('You do not have access to this task');
    res.json(task);
  } catch (err) {
    next(err);
  }
};

export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dto = req.body as CreateTaskDto;
    const task = await TaskModel.create({
      ...dto,
      deadline: new Date(dto.deadline),
    });
    res.status(201).json(task.toJSON());
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const task = await TaskModel.findById(req.params['id']);
    if (!task) throw new NotFoundError('Task', req.params['id']);
    if (task.assigneeId.toString() !== userId)
      throw new ForbiddenError('Only the assignee can update this task');

    const dto = req.body as UpdateTaskDto;
    const updates = stripUndefined({
      title: dto.title,
      description: dto.description,
      assigneeId: dto.assigneeId,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      status: dto.status,
    } as Record<string, unknown>);

    const updated = await TaskModel.findByIdAndUpdate(
      req.params['id'],
      { $set: updates },
      { new: true, runValidators: true }
    );
    res.json(updated?.toJSON());
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await TaskModel.findById(req.params['id']);
    if (!task) throw new NotFoundError('Task', req.params['id']);
    await task.deleteOne();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
