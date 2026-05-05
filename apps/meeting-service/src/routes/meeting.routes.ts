import { Router } from 'express';
import {
  listMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  addParticipant,
  updateParticipant,
  removeParticipant,
  addDecision,
  removeDecision,
} from '../controllers/meeting.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateRequest } from '@mm/shared-types';
import {
  CreateMeetingSchema,
  UpdateMeetingSchema,
  MeetingQuerySchema,
  AddParticipantSchema,
  UpdateParticipantSchema,
  AddDecisionSchema,
} from '@mm/shared-types';

export const createMeetingRouter = (): Router => {
  const router = Router();

  router.use(requireAuth);

  router.get('/meetings', validateRequest({ query: MeetingQuerySchema }), listMeetings);
  router.post('/meetings', validateRequest({ body: CreateMeetingSchema }), createMeeting);
  router.get('/meetings/:id', getMeeting);
  router.patch('/meetings/:id', validateRequest({ body: UpdateMeetingSchema }), updateMeeting);
  router.delete('/meetings/:id', deleteMeeting);

  // Participants
  router.post('/meetings/:id/participants', validateRequest({ body: AddParticipantSchema }), addParticipant);
  router.patch('/meetings/:id/participants/:userId', validateRequest({ body: UpdateParticipantSchema }), updateParticipant);
  router.delete('/meetings/:id/participants/:userId', removeParticipant);

  // Decisions
  router.post('/meetings/:id/decisions', validateRequest({ body: AddDecisionSchema }), addDecision);
  router.delete('/meetings/:id/decisions/:decisionId', removeDecision);

  return router;
};
