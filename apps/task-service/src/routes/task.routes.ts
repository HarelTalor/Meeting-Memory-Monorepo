import { Router } from 'express';
import { listTasks, getTask, createTask, updateTask, deleteTask } from '../controllers/task.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateRequest, CreateTaskSchema, UpdateTaskSchema, TaskQuerySchema } from '@mm/shared-types';

export const createTaskRouter = (): Router => {
  const router = Router();
  router.use(requireAuth);
  router.get('/tasks', validateRequest({ query: TaskQuerySchema }), listTasks);
  router.post('/tasks', validateRequest({ body: CreateTaskSchema }), createTask);
  router.get('/tasks/:id', getTask);
  router.patch('/tasks/:id', validateRequest({ body: UpdateTaskSchema }), updateTask);
  router.delete('/tasks/:id', deleteTask);
  return router;
};
