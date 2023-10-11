import express from 'express';
import joi from 'joi';
import {asyncHandler} from '../../middlewares/error';
import {authenticateAccessToken, authorize} from '../../middlewares/security';
import {paramsValidationHandler} from '../../middlewares/validation';
import * as ChatService from '../../services/chats';

// eslint-disable-next-line new-cap
const router = express.Router();

router.get(
  '/chats/private/:id',
  authenticateAccessToken(),
  paramsValidationHandler(joi.object().keys({id: joi.string().hex().required()})),
  authorize(async (req) => {
    const chat = await ChatService.getPrivateChatById(req.params.id);
    return chat.participants.some((participant) => participant.id === req.user.id);
  }),
  asyncHandler(async (req, res) => {
    const chat = await ChatService.getPrivateChatById(req.params.id);

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
  '/user/me/chats/private',
  authenticateAccessToken(),
  asyncHandler(async (req, res) => {
    const chats = await ChatService.getPrivateChatsOfUser(req.user.id);

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
  '/chats/private',
  authenticateAccessToken(),
  asyncHandler(async (req, res) => {
    const chat = await ChatService.createPrivateChat(req.body, req.user);

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
