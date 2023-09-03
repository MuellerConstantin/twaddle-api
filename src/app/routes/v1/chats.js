import express from 'express';
import joi from 'joi';
import {asyncHandler} from '../../middlewares/error';
import {authenticateAccessToken, authorize} from '../../middlewares/security';
import {paramsValidationHandler} from '../../middlewares/validation';
import * as ChatService from '../../services/chats';

// eslint-disable-next-line new-cap
const router = express.Router();

router.get(
  '/chats/:id',
  authenticateAccessToken(),
  paramsValidationHandler(joi.object().keys({id: joi.string().hex().required()})),
  authorize(async (req) => {
    const chat = await ChatService.getChatById(req.params.id);
    return chat.participants.some((participant) => participant.id === req.user.id);
  }),
  asyncHandler(async (req, res) => {
    const chat = await ChatService.getChatById(req.params.id);

    return res.status(200).json({
      id: chat.id,
      participants: chat.participants
        .filter((participant) => participant.id !== req.user.id)
        .map((participant) => ({
          id: participant.id,
          username: participant.username,
          displayName: participant.displayName,
          location: participant.location,
          status: participant.status,
        })),
    });
  }),
);

router.get(
  '/user/me/chats',
  authenticateAccessToken(),
  asyncHandler(async (req, res) => {
    const chats = await ChatService.getChatsOfUser(req.user.id);

    return res.status(200).json(
      chats.map((chat) => ({
        id: chat.id,
        participants: chat.participants
          .filter((participant) => participant.id !== req.user.id)
          .map((participant) => ({
            id: participant.id,
            username: participant.username,
            displayName: participant.displayName,
            location: participant.location,
            status: participant.status,
          })),
      })),
    );
  }),
);

router.post(
  '/chats',
  authenticateAccessToken(),
  asyncHandler(async (req, res) => {
    if (!req.body.participants?.includes(req.user.id)) {
      req.body.participants?.push(req.user.id);
    }

    const chat = await ChatService.createChat(req.body);

    return res.status(201).json({
      id: chat.id,
      participants: chat.participants
        .filter((participant) => participant.id !== req.user.id)
        .map((participant) => ({
          id: participant.id,
          username: participant.username,
          displayName: participant.displayName,
          location: participant.location,
          status: participant.status,
        })),
    });
  }),
);

export default router;
