import express from 'express';
import joi from 'joi';
import {asyncHandler} from '../../middlewares/error';
import {authenticateAccessToken, authorize} from '../../middlewares/security';
import {paramsValidationHandler, queryValidationHandler} from '../../middlewares/validation';
import * as ChatService from '../../services/chats';
import * as MessageService from '../../services/messages';

// eslint-disable-next-line new-cap
const router = express.Router();

router.get(
  '/chats/:id/messages',
  authenticateAccessToken(),
  paramsValidationHandler(joi.object().keys({id: joi.string().hex().required()})),
  queryValidationHandler(
    joi.object({
      perPage: joi.number().positive().greater(0).default(25).optional(),
      page: joi.number().positive().allow(0).default(0).optional(),
      timestampOffset: joi.date().iso().optional(),
    }),
  ),
  authorize(async (req) => {
    const chat = await ChatService.getChatById(req.params.id);
    return chat.participants.some((participant) => participant.id === req.user.id);
  }),
  asyncHandler(async (req, res) => {
    const {perPage, page, timestampOffset} = req.query;
    const [messages, info] = await MessageService.getMessagesOfChat(req.params.id, {perPage, page, timestampOffset});

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
