import express from 'express';
import joi from 'joi';
import {asyncHandler} from '../../middlewares/error';
import {authenticateAccessToken, authorize} from '../../middlewares/security';
import {paramsValidationHandler, queryValidationHandler} from '../../middlewares/validation';
import {imageUpload} from '../../middlewares/multer';
import * as GroupChatService from '../../services/groupChats';

// eslint-disable-next-line new-cap
const router = express.Router();

const isMemberGuard =
  (chatIdParam = 'id') =>
  async (req) => {
    const chat = await GroupChatService.getChatById(req.params[chatIdParam]);
    return chat.participants.some((participant) => participant.user.id === req.user.id);
  };

const isAdminGuard =
  (chatIdParam = 'id') =>
  async (req) => {
    const chat = await GroupChatService.getChatById(req.params[chatIdParam]);
    return chat.participants.some((participant) => participant.user.id === req.user.id && participant.isAdmin);
  };

router.get(
  '/chats/group/:id',
  authenticateAccessToken(),
  paramsValidationHandler(joi.object().keys({id: joi.string().hex().required()})),
  authorize(isMemberGuard()),
  asyncHandler(async (req, res) => {
    const chat = await GroupChatService.getChatById(req.params.id);

    return res.status(200).json({
      id: chat.id,
      name: chat.name,
      participants: chat.participants.map((participant) => ({
        id: participant.user.id,
        username: participant.user.username,
        displayName: participant.user.displayName,
        location: participant.user.location,
        status: participant.user.status,
        isAdmin: participant.isAdmin,
      })),
    });
  }),
);

router.get(
  '/user/me/chats/group',
  authenticateAccessToken(),
  asyncHandler(async (req, res) => {
    const chats = await GroupChatService.getChatsOfUser(req.user.id);

    return res.status(200).json(
      chats.map((chat) => ({
        id: chat.id,
        name: chat.name,
        participants: chat.participants.map((participant) => ({
          id: participant.user.id,
          username: participant.user.username,
          displayName: participant.user.displayName,
          location: participant.user.location,
          status: participant.user.status,
          isAdmin: participant.isAdmin,
        })),
      })),
    );
  }),
);

router.post(
  '/chats/group',
  authenticateAccessToken(),
  asyncHandler(async (req, res) => {
    const chat = await GroupChatService.createChat(req.body, req.user);

    return res.status(201).json({
      id: chat.id,
      name: chat.name,
      participants: chat.participants.map((participant) => ({
        id: participant.user.id,
        username: participant.user.username,
        displayName: participant.user.displayName,
        location: participant.user.location,
        status: participant.user.status,
        isAdmin: participant.isAdmin,
      })),
    });
  }),
);

router.patch(
  '/chats/group/:id',
  authenticateAccessToken(),
  paramsValidationHandler(joi.object().keys({id: joi.string().hex().required()})),
  authorize(isAdminGuard()),
  asyncHandler(async (req, res) => {
    const chat = await GroupChatService.updateChatById(req.params.id, req.body);

    return res.status(200).json({
      id: chat.id,
      name: chat.name,
      participants: chat.participants.map((participant) => ({
        id: participant.user.id,
        username: participant.user.username,
        displayName: participant.user.displayName,
        location: participant.user.location,
        status: participant.user.status,
        isAdmin: participant.isAdmin,
      })),
    });
  }),
);

router.post(
  '/chats/group/:id/participants',
  authenticateAccessToken(),
  paramsValidationHandler(joi.object().keys({id: joi.string().hex().required()})),
  authorize(isAdminGuard()),
  asyncHandler(async (req, res) => {
    await GroupChatService.addParticipantToChat(req.params.id, req.body);

    return res.status(204).send();
  }),
);

router.delete(
  '/chats/group/:chatId/participants/:userId',
  authenticateAccessToken(),
  paramsValidationHandler(
    joi.object().keys({
      chatId: joi.string().hex().required(),
      userId: joi.string().hex().required(),
    }),
  ),
  authorize(isAdminGuard('chatId')),
  asyncHandler(async (req, res) => {
    await GroupChatService.removeParticipantFromChat(req.params.chatId, req.params.userId);

    return res.status(204).send();
  }),
);

router.post(
  '/chats/group/:chatId/participants/:userId/admin',
  authenticateAccessToken(),
  paramsValidationHandler(
    joi.object().keys({
      chatId: joi.string().hex().required(),
      userId: joi.string().hex().required(),
    }),
  ),
  authorize(isAdminGuard('chatId')),
  asyncHandler(async (req, res) => {
    await GroupChatService.appointParticipantAsAdmin(req.params.chatId, req.params.userId);

    return res.status(204).send();
  }),
);

router.delete(
  '/chats/group/:chatId/participants/:userId/admin',
  authenticateAccessToken(),
  paramsValidationHandler(
    joi.object().keys({
      chatId: joi.string().hex().required(),
      userId: joi.string().hex().required(),
    }),
  ),
  authorize(isAdminGuard('chatId')),
  asyncHandler(async (req, res) => {
    await GroupChatService.removeParticipantAsAdmin(req.params.chatId, req.params.userId);

    return res.status(204).send();
  }),
);

router.post(
  '/chats/group/:id/avatar',
  authenticateAccessToken(),
  paramsValidationHandler(joi.object().keys({id: joi.string().hex().required()})),
  authorize(isAdminGuard()),
  imageUpload.single('file'),
  asyncHandler(async (req, res) => {
    await GroupChatService.updateChatAvatar(req.params.id, req.file.key);

    return res.status(204).send();
  }),
);

router.get(
  '/chats/group/:id/avatar',
  authenticateAccessToken(),
  paramsValidationHandler(joi.object().keys({id: joi.string().hex().required()})),
  authorize(isMemberGuard()),
  asyncHandler(async (req, res) => {
    const {id} = req.params;

    const avatar = await GroupChatService.getChatAvatar(id);

    res.header('Content-Type', avatar.ContentType);
    res.header('Content-Length', avatar.ContentLength);

    return avatar.Body.pipe(res);
  }),
);

router.delete(
  '/chats/group/:id/avatar',
  authenticateAccessToken(),
  paramsValidationHandler(joi.object().keys({id: joi.string().hex().required()})),
  authorize(isAdminGuard()),
  asyncHandler(async (req, res) => {
    await GroupChatService.updateChatAvatar(req.params.id, null);

    return res.status(204).send();
  }),
);

router.get(
  '/chats/group/:id/messages',
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
    const [messages, info] = await GroupChatService.getMessagesOfChat(req.params.id, {
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
