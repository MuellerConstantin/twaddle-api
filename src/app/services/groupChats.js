import mongoose from 'mongoose';
import joi from 'joi';
import env from '../config/env';
import s3, {DeleteObjectCommand, GetObjectCommand} from '../config/s3';
import {validateData} from '../middlewares/validation';
import {ApiError} from '../middlewares/error';
import GroupChat from '../models/groupChat';
import User from '../models/user';

/**
 * Retrieves a single group chat by its identifier.
 *
 * @param {string} id Identifier of the chat to retrieve
 * @return {Promise<object>} The retrieved chat
 */
export async function getChatById(id) {
  const chat = await GroupChat.findById(id).populate('participants.user');

  if (!chat) {
    throw new ApiError('Resource not found', 404);
  }

  return chat;
}

/**
 * Retrieves the group chats of a single user by its identifier.
 *
 * @param {string} id Identifier of the user to retrieve chats for
 * @return {Promise<Array>} The retrieved chats
 */
export async function getChatsOfUser(id) {
  const chats = await GroupChat.find({'participants.user': {$all: [id]}}).populate('participants.user');

  return chats;
}

/**
 * Opens a new group chat between two users.
 *
 * @param {object} data Data of the chat to create
 * @param {string} createdBy The user who creates the chat
 * @return {Promise<object>} The created chat
 */
export async function createChat(data, createdBy) {
  data = validateData(
    joi.object({
      name: joi.string().max(75).required(),
      participants: joi.array().items(joi.string().hex()).default([]),
    }),
    data,
  );

  // Adds the user to the conversation if it is not already present
  if (!data.participants.includes(createdBy.id)) {
    data.participants.push(createdBy.id);
  }

  if (!(await User.exists({_id: {$in: data.participants}}))) {
    throw new ApiError('Resource not found', 404);
  }

  const chat = await GroupChat.create({
    ...data,
    participants: data.participants.map((participant) => ({user: participant, isAdmin: participant === createdBy.id})),
  });

  return GroupChat.populate(chat, {path: 'participants.user'});
}

/**
 * Updates a group chat by its identifier.
 *
 * @param {string} id Identifier of the chat to update
 * @param {object} data Data of the chat to update
 * @return {Promise<object>} The updated chat
 */
export async function updateChatById(id, data) {
  data = validateData(
    joi.object({
      name: joi.string().max(75).optional(),
    }),
    data,
  );

  const update = {$set: {}, $unset: {}};

  Object.keys(data).forEach((key) => {
    if (data[key] === null) {
      update.$unset[key] = 1;
    } else {
      update.$set[key] = data[key];
    }
  });

  const chat = GroupChat.findByIdAndUpdate(id, update, {
    new: true,
  });

  if (!chat) {
    throw new ApiError('Resource not found', 404);
  }

  return chat;
}

/**
 * Adds a participant to a group chat.
 *
 * @param {string} chatId Identifier of the chat to add the participant to
 * @param {object} data Data of the participant to add
 */
export async function addParticipantToChat(chatId, data) {
  data = validateData(
    joi.object({
      userId: joi.string().hex().required(),
    }),
    data,
  );

  const chat = await GroupChat.findById(chatId).populate('participants.user');

  if (!chat) {
    throw new ApiError('Chat not found', 404);
  }

  if (!User.exists({_id: data.userId})) {
    throw new ApiError('User not found', 404);
  }

  if (chat.participants.some((participant) => participant.user.id === data.userId)) {
    throw new ApiError('User is already a participant of the chat', 409);
  }

  chat.participants.push({user: data.userId, isAdmin: false});
  await chat.save();
}

/**
 * Removes a participant from a group chat.
 *
 * @param {string} chatId Identifier of the chat to remove the participant from
 * @param {string} userId Identifier of the participant to remove
 */
export async function removeParticipantFromChat(chatId, userId) {
  const chat = await GroupChat.findById(chatId).populate('participants.user');

  if (!chat) {
    throw new ApiError('Chat not found', 404);
  }

  if (!chat.participants.some((participant) => participant.user.id === userId)) {
    throw new ApiError('User is not a participant of the chat', 404);
  }

  // When the last participant is removed, the chat is deleted
  if (chat.participants.length === 1) {
    await chat.delete();
    return;
  }

  // When the last administrator is removed, the next best user becomes the administrator
  if (chat.participants.filter((participant) => participant.isAdmin && participant.user.id !== userId).length === 0) {
    chat.participants.find((participant) => participant.user.id !== userId).isAdmin = true;
  }

  chat.participants = chat.participants.filter((participant) => participant.user.id !== userId);
  await chat.save();
}

/**
 * Appoints a participant as admin of a group chat.
 *
 * @param {string} chatId The chat to appoint the participant as admin
 * @param {string} userId The participant to appoint as admin
 */
export async function appointParticipantAsAdmin(chatId, userId) {
  const chat = await GroupChat.findById(chatId).populate('participants.user');

  if (!chat) {
    throw new ApiError('Chat not found', 404);
  }

  if (!chat.participants.some((participant) => participant.user.id === userId)) {
    throw new ApiError('User is not a participant of the chat', 404);
  }

  chat.participants.find((participant) => participant.user.id === userId).isAdmin = true;
  await chat.save();
}

/**
 * Removes a participant as admin of a group chat.
 *
 * @param {string} chatId The chat from which to remove the participant as admin
 * @param {string} userId The participant to remove as admin
 */
export async function removeParticipantAsAdmin(chatId, userId) {
  const chat = await GroupChat.findById(chatId).populate('participants.user');

  if (!chat) {
    throw new ApiError('Chat not found', 404);
  }

  if (!chat.participants.some((participant) => participant.user.id === userId)) {
    throw new ApiError('User is not a participant of the chat', 404);
  }

  chat.participants.find((participant) => participant.user.id === userId).isAdmin = false;
  await chat.save();
}

/**
 * Updates a group chat avatar.
 *
 * @param {string} id Identifier of group chat to update
 * @param {string} avatar Key of avatar in object storage
 */
export async function updateChatAvatar(id, avatar) {
  const chat = await GroupChat.findById(id);

  if (!chat) {
    throw new ApiError('Resource not found', 404);
  }

  if (avatar === null) {
    if (chat.avatar) {
      await s3.send(new DeleteObjectCommand({Bucket: env.s3.bucket, Key: chat.avatar}));
    }

    await GroupChat.findByIdAndUpdate(
      id,
      {
        $unset: {
          avatar: 1,
        },
      },
      {new: true},
    );
  } else {
    await GroupChat.findByIdAndUpdate(
      id,
      {
        $set: {
          avatar,
        },
      },
      {new: true},
    );
  }
}

/**
 * Get a group chat's avatar.
 *
 * @param {string} id Identifier of group chat to retrieve avatar
 */
export async function getChatAvatar(id) {
  const chat = await GroupChat.findById(id);

  if (!chat) {
    throw new ApiError('Resource not found', 404);
  }

  if (!chat.avatar) {
    throw new ApiError('Resource not found', 404);
  }

  return await s3.send(new GetObjectCommand({Bucket: env.s3.bucket, Key: chat.avatar}));
}

/**
 * Retrieves all messages of a single group chat by its identifier in a paginated way.
 *
 * When the `timestampOffset` parameter is specified, only messages created after
 * the specified date will be returned. This is useful to implement a "load more"
 * functionality.
 *
 * @param {string} id Identifier of the chat to retrieve messages for
 * @param {{perPage: number, page: number}=} pageable Page number
 * @param {Date=} timestampOffset Offset to load messages from a specific date onwards
 * @return {Promise<[object[], object]>} Returns a tuple with the list of users and pagination info
 */
export async function getMessagesOfChat(id, pageable = {perPage: 25, page: 0, timestampOffset: null}) {
  const {perPage, page, timestampOffset} = pageable;

  let messages;

  if (timestampOffset) {
    messages = await GroupChat.aggregate([
      {$match: {_id: new mongoose.Types.ObjectId(id)}},
      {$unwind: '$messages'},
      {$match: {'messages.createdAt': {$lt: timestampOffset}}},
      {$sort: {'messages.createdAt': -1}},
      {$skip: perPage * page},
      {$limit: perPage},
      {$replaceRoot: {newRoot: '$messages'}},
    ]);
  } else {
    messages = await GroupChat.aggregate([
      {$match: {_id: new mongoose.Types.ObjectId(id)}},
      {$unwind: '$messages'},
      {$sort: {'messages.createdAt': -1}},
      {$skip: perPage * page},
      {$limit: perPage},
      {$replaceRoot: {newRoot: '$messages'}},
    ]);
  }

  const totalMessages =
    (
      await GroupChat.aggregate([
        {$match: {_id: new mongoose.Types.ObjectId(id)}},
        {$unwind: '$messages'},
        {$count: 'total'},
      ])
    )[0]?.total ?? 0;

  const info = {
    page,
    perPage,
    totalPages: Math.ceil(totalMessages / perPage),
    totalElements: totalMessages,
  };

  return [messages, info];
}

/**
 * Adds a new message to a group chat.
 *
 * @param {string} id Identifier of the chat to add the message to
 * @param {object} message The message to add
 * @return {Promise<void>} A promise that resolves when the message has been added
 */
export async function addMessageToChat(id, message) {
  message = validateData(
    joi.object({
      from: joi.string().hex().required(),
      content: joi.string().required(),
    }),
    message,
  );

  const chat = await GroupChat.findOneAndUpdate(
    {_id: id, 'participants.user': {$in: [message.from]}},
    {$push: {messages: message}},
    {new: true},
  ).populate('participants.user');

  if (!chat) {
    throw new ApiError('Resource not found', 404);
  }

  return chat;
}
