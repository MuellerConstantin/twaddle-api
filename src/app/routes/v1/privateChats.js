import express from 'express';
import joi from 'joi';
import {asyncHandler} from '../../middlewares/error';
import {authenticateAccessToken, authorize} from '../../middlewares/security';
import {paramsValidationHandler, queryValidationHandler} from '../../middlewares/validation';
import * as PrivateChatService from '../../services/privateChats';

// eslint-disable-next-line new-cap
const router = express.Router();

const isMemberGuard =
  (chatIdParam = 'id') =>
  async (req) => {
    const chat = await PrivateChatService.getChatById(req.params[chatIdParam]);
    return chat.participants.some((participant) => participant.id === req.user.id);
  };

router.get(
  '/chats/private/:id',
  authenticateAccessToken(),
  paramsValidationHandler(joi.object().keys({id: joi.string().hex().required()})),
  authorize(isMemberGuard()),
  asyncHandler(async (req, res) => {
    const chat = await PrivateChatService.getChatById(req.params.id);

    return res.status(200).json({
      id: chat.id,
      participants: chat.participants.map((participant) => ({
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
    const chats = await PrivateChatService.getChatsOfUser(req.user.id);

    return res.status(200).json(
      chats.map((chat) => ({
        id: chat.id,
        participants: chat.participants.map((participant) => ({
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
    const chat = await PrivateChatService.createChat(req.body, req.user);

    return res.status(201).json({
      id: chat.id,
      participants: chat.participants.map((participant) => ({
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
  '/chats/private/:id/messages',
  authenticateAccessToken(),
  paramsValidationHandler(joi.object().keys({id: joi.string().hex().required()})),
  queryValidationHandler(
    joi.object({
      perPage: joi.number().positive().greater(0).default(25).optional(),
      page: joi.number().positive().allow(0).default(0).optional(),
      timestampOffset: joi.date().iso().optional(),
    }),
  ),
  authorize(isMemberGuard()),
  asyncHandler(async (req, res) => {
    const {perPage, page, timestampOffset} = req.query;
    const [messages, info] = await PrivateChatService.getMessagesOfChat(req.params.id, {
      perPage,
      page,
      timestampOffset,
    });

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

export default router;
