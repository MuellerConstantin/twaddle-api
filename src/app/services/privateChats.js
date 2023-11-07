import mongoose from 'mongoose';
import joi from 'joi';
import {validateData} from '../middlewares/validation';
import {ApiError} from '../middlewares/error';
import PrivateChat from '../models/privateChat';
import User from '../models/user';

/**
 * Retrieves a single private chat by its identifier.
 *
 * @param {string} id Identifier of the chat to retrieve
 * @return {Promise<object>} The retrieved chat
 */
export async function getChatById(id) {
  const chat = await PrivateChat.findById(id).populate('participants');

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
export async function getChatsOfUser(id) {
  const chats = await PrivateChat.find({participants: {$all: [id]}}).populate('participants');

  return chats;
}

/**
 * Opens a new private chat between two users. If the chat already exists, it is returned instead.
 *
 * @param {object} data Data of the chat to create
 * @param {string} createdBy The user who creates the chat
 * @return {Promise<object>} The created chat
 */
export async function createChat(data, createdBy) {
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
 * Retrieves all messages of a single private chat by its identifier in a paginated way.
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
    messages = await PrivateChat.aggregate([
      {$match: {_id: new mongoose.Types.ObjectId(id)}},
      {$unwind: '$messages'},
      {$match: {'messages.createdAt': {$lt: timestampOffset}}},
      {$sort: {'messages.createdAt': -1}},
      {$skip: perPage * page},
      {$limit: perPage},
      {$replaceRoot: {newRoot: '$messages'}},
    ]);
  } else {
    messages = await PrivateChat.aggregate([
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
      await PrivateChat.aggregate([
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
 * Adds a new message to a private chat.
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

  const chat = await PrivateChat.findOneAndUpdate(
    {_id: id, participants: {$in: [message.from]}},
    {$push: {messages: message}},
    {new: true},
  ).populate('participants');

  if (!chat) {
    throw new ApiError('Resource not found', 404);
  }

  return chat;
}
