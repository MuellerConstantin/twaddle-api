import joi from 'joi';
import {validateData} from '../middlewares/validation';
import {ApiError} from '../middlewares/error';
import Chat from '../models/chat';
import User from '../models/user';

/**
 * Retrieves a single chat by its identifier.
 *
 * @param {string} id Identifier of the chat to retrieve
 * @return {Promise<object>} The retrieved chat
 */
export async function getChatById(id) {
  const chat = await Chat.findById(id).populate('participants');

  if (!chat) {
    throw new ApiError('Resource not found', 404);
  }

  return chat;
}

/**
 * Retrieves the chats of a single user by its identifier.
 *
 * @param {string} id Identifier of the user to retrieve chats for
 * @return {Promise<Array>} The retrieved chats
 */
export async function getChatsOfUser(id) {
  const chats = await Chat.find({participants: {$all: [id]}}).populate('participants');

  return chats;
}

/**
 * Opens a new private chat between two users.
 *
 * @param {object} data Data of the chat to create
 * @return {Promise<object>} The created chat
 */
export async function createChat(data) {
  validateData(
    joi.object({
      participants: joi.array().items(joi.string().hex().required()).length(2).required(),
    }),
    data,
  );

  if (await Chat.exists({participants: {$all: data.participants}})) {
    throw new ApiError('Resource already exists', 409);
  }

  if (!(await User.exists({_id: {$in: data.participants}}))) {
    throw new ApiError('Resource not found', 404);
  }

  const chat = await Chat.create(data);

  return Chat.populate(chat, {path: 'participants'});
}
