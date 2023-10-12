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
  '/chats/group/:id',
  authenticateAccessToken(),
  paramsValidationHandler(joi.object().keys({id: joi.string().hex().required()})),
  authorize(async (req) => {
    const chat = await ChatService.getGroupChatById(req.params.id);
    return chat.participants.some((participant) => participant.user.id === req.user.id);
  }),
  asyncHandler(async (req, res) => {
    const chat = await ChatService.getPrivateChatById(req.params.id);

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
  '/user/me/chats/private',
  authenticateAccessToken(),
  asyncHandler(async (req, res) => {
    const chats = await ChatService.getPrivateChatsOfUser(req.user.id);

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

router.get(
  '/user/me/chats/group',
  authenticateAccessToken(),
  asyncHandler(async (req, res) => {
    const chats = await ChatService.getGroupChatsOfUser(req.user.id);

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
  '/chats/private',
  authenticateAccessToken(),
  asyncHandler(async (req, res) => {
    const chat = await ChatService.createPrivateChat(req.body, req.user);

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

router.post(
  '/chats/group',
  authenticateAccessToken(),
  asyncHandler(async (req, res) => {
    const chat = await ChatService.createGroupChat(req.body, req.user);

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

export default router;
