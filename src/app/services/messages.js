import mongoose from 'mongoose';
import joi from 'joi';
import {validateData} from '../middlewares/validation';
import {ApiError} from '../middlewares/error';
import Chat from '../models/chat';

/**
 * Retrieves all messages of a single chat by its identifier in a paginated way.
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
    messages = await Chat.aggregate([
      {$match: {_id: new mongoose.Types.ObjectId(id)}},
      {$unwind: '$messages'},
      {$match: {'messages.createdAt': {$lt: timestampOffset}}},
      {$sort: {'messages.createdAt': -1}},
      {$skip: perPage * page},
      {$limit: perPage},
      {$replaceRoot: {newRoot: '$messages'}},
    ]);
  } else {
    messages = await Chat.aggregate([
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
      await Chat.aggregate([
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
 * Adds a new message to a chat.
 *
 * @param {string} id Identifier of the chat to add the message to
 * @param {object} message The message to add
 * @return {Promise<void>} A promise that resolves when the message has been added
 */
export async function addMessageToChat(id, message) {
  validateData(
    joi.object({
      from: joi.string().hex().required(),
      content: joi.string().required(),
    }),
    message,
  );

  const chat = await Chat.findOneAndUpdate(
    {_id: id, participants: {$in: [message.from]}},
    {$push: {messages: message}},
    {new: true},
  ).populate('participants');

  if (!chat) {
    throw new ApiError('Resource not found', 404);
  }

  return chat;
}
