import express from 'express';
import joi from 'joi';
import {asyncHandler} from '../../middlewares/error';
import {authenticateAccessToken, authorize} from '../../middlewares/security';
import {paramsValidationHandler, queryValidationHandler} from '../../middlewares/validation';
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
  '/chats/:id/messages',
  authenticateAccessToken(),
  paramsValidationHandler(joi.object().keys({id: joi.string().hex().required()})),
  queryValidationHandler(
    joi.object({
      perPage: joi.number().positive().greater(0).default(25).optional(),
      page: joi.number().positive().allow(0).default(0).optional(),
    }),
  ),
  authorize(async (req) => {
    const chat = await ChatService.getChatById(req.params.id);
    return chat.participants.some((participant) => participant.id === req.user.id);
  }),
  asyncHandler(async (req, res) => {
    const {perPage, page} = req.query;
    const [messages, info] = await ChatService.getMessagesOfChat(req.params.id, {perPage, page});

    return res.status(200).json({
      content: messages.map((message) => ({
        from: message.from,
        content: message.content,
        timestamp: message.createdAt,
      })),
      info,
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
