import joi from "joi";
import { ApiError } from "../middlewares/error";
import { validate } from "../middlewares/validation";
import Message from "../models/message";

/**
 * @typedef {object} MessageDTO
 * @property {string} id
 * @property {string} content
 * @property {string} user
 * @property {string} room
 * @property {string} timestamp
 */

/**
 * @typedef {object} PageInfo
 * @property {number} page
 * @property {number} perPage
 * @property {number} totalPages
 * @property {number} totalElements
 */

/**
 * Finds a message by its identifier.
 *
 * @param {string} id Identifier to search for
 * @returns {Promise<MessageDTO>} Returns the fetched message
 */

export const findById = async (id) => {
  const message = await Message.findById(id).populate("user", "username");

  if (!message) {
    throw new ApiError("Resource not found", 404, "NotFoundError");
  }

  return message.toDTO();
};

/**
 * Find all available messages of a room paged.
 *
 * @param {string} roomId Id of the room from which messages should be loaded
 * @param {{perPage: number, page: number}=} pageable Pagination settings
 * @returns {Promise<[[MessageDTO], PageInfo]>} Returns the fetched page
 */
export const findAllByRoom = async (
  roomId,
  pageable = { perPage: 25, page: 0 }
) => {
  const { perPage, page } = pageable;

  const messages = await Message.find({ room: roomId })
    .populate("user", "username")
    .limit(perPage)
    .skip(perPage * page)
    .sort({ name: 1 });

  const totalMessages = await Message.count();

  const info = {
    page,
    perPage,
    totalPages: Math.ceil(totalMessages / perPage),
    totalElements: totalMessages,
  };

  const content = messages.map((message) => message.toDTO());

  return [content, info];
};

/**
 * Creates a new message.
 *
 * @param {object} doc Fields of new message to create
 * @returns {Promise<MessageDTO>} Returns the created message
 */
export const create = async (doc) => {
  validate(
    joi.object({
      content: joi.string().required(),
      room: joi.string().hex().length(24).required(),
      user: joi.string().hex().length(24).required(),
    }),
    doc
  );

  const message = await Message.create(doc);
  await message.populate("user", "username");

  return message.toDTO();
};

/**
 * Finds a message and deletes it.
 *
 * @param {string} id Identifier to search for
 * @returns {Promise<void>} Returns nothing on success
 */
export const deleteById = async (id) => {
  const message = await Message.findByIdAndDelete(id);

  if (!message) {
    throw new ApiError("Resource not found", 404, "NotFoundError");
  }
};
