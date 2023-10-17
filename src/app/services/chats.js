import joi from 'joi';
import {validateData} from '../middlewares/validation';
import {ApiError} from '../middlewares/error';
import {PrivateChatModel as PrivateChat, GroupChatModel as GroupChat} from '../models/chat';
import User from '../models/user';

/**
 * Retrieves a single private chat by its identifier.
 *
 * @param {string} id Identifier of the chat to retrieve
 * @return {Promise<object>} The retrieved chat
 */
export async function getPrivateChatById(id) {
  const chat = await PrivateChat.findById(id).populate('participants');

  if (!chat) {
    throw new ApiError('Resource not found', 404);
  }

  return chat;
}

/**
 * Retrieves a single group chat by its identifier.
 *
 * @param {string} id Identifier of the chat to retrieve
 * @return {Promise<object>} The retrieved chat
 */
export async function getGroupChatById(id) {
  const chat = await GroupChat.findById(id).populate('participants.user');

  if (!chat) {
    throw new ApiError('Resource not found', 404);
  }

  return chat;
}

/**
 * Retrieves the private chats of a single user by its identifier.
 *
 * @param {string} id Identifier of the user to retrieve chats for
 * @return {Promise<Array>} The retrieved chats
 */
export async function getPrivateChatsOfUser(id) {
  const chats = await PrivateChat.find({participants: {$all: [id]}}).populate('participants');

  return chats;
}

/**
 * Retrieves the group chats of a single user by its identifier.
 *
 * @param {string} id Identifier of the user to retrieve chats for
 * @return {Promise<Array>} The retrieved chats
 */
export async function getGroupChatsOfUser(id) {
  const chats = await GroupChat.find({'participants.user': {$all: [id]}}).populate('participants.user');

  return chats;
}

/**
 * Opens a new private chat between two users. If the chat already exists, it is returned instead.
 *
 * @param {object} data Data of the chat to create
 * @param {string} createdBy The user who creates the chat
 * @return {Promise<object>} The created chat
 */
export async function createPrivateChat(data, createdBy) {
  data = validateData(
    joi.object({
      participants: joi.array().items(joi.string().hex().required()).min(1).max(2).required(),
    }),
    data,
  );

  // Ensure the user is part of the conversation itself if already two participants are present
  if (data.participants.length == 2 && !data.participants.includes(createdBy.id)) {
    throw new ApiError('You must be a participant of the conversation', 409);
  }

  // Prevent users from starting a conversation with themselves
  if (data.participants.length == 1 && data.participants.includes(createdBy.id)) {
    throw new ApiError('You cannot start a conversation with yourself', 409);
  }

  // Adds the user to the conversation if it is not already present
  if (!data.participants.includes(createdBy.id)) {
    data.participants.push(createdBy.id);
  }

  if (await PrivateChat.exists({participants: {$all: data.participants}})) {
    return PrivateChat.findOne({participants: {$all: data.participants}}).populate('participants');
  }

  if (!(await User.exists({_id: {$in: data.participants}}))) {
    throw new ApiError('Resource not found', 404);
  }

  const chat = await PrivateChat.create(data);

  return PrivateChat.populate(chat, {path: 'participants'});
}

/**
 * Opens a new group chat between two users.
 *
 * @param {object} data Data of the chat to create
 * @param {string} createdBy The user who creates the chat
 * @return {Promise<object>} The created chat
 */
export async function createGroupChat(data, createdBy) {
  data = validateData(
    joi.object({
      name: joi.string().required(),
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
 * Adds a participant to a group chat.
 *
 * @param {string} chatId Identifier of the chat to add the participant to
 * @param {object} data Data of the participant to add
 */
export async function addParticipantToGroupChat(chatId, data) {
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
