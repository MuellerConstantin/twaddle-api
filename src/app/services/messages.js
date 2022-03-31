import joi from "joi";
import { ApiError, ApiErrorCode } from "../middlewares/error";
import { validate } from "../middlewares/validation";
import { parse as parseRsql } from "../middlewares/rsql";
import { parse as parseSort } from "../middlewares/sorting";
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
  const message = await Message.findById(id).populate("user");

  if (!message) {
    throw new ApiError("Resource not found", 404, ApiErrorCode.NOT_FOUND_ERROR);
  }

  return message.toDTO();
};

/**
 * Find all available messages of a room paged.
 *
 * @param {string} roomId Id of the room from which messages should be loaded
 * @param {string=} filter RSQL query filter
 * @param {string=} sort Sorting instruction
 * @param {{perPage: number, page: number}=} pageable Pagination settings
 * @returns {Promise<[[MessageDTO], PageInfo]>} Returns the fetched page
 */
export const findAllByRoom = async (
  roomId,
  filter,
  sort,
  pageable = { perPage: 25, page: 0 }
) => {
  const { perPage, page } = pageable;

  const mongoFilter = filter ? parseRsql(filter) : {};
  const mongoSort = sort ? parseSort(sort) : { createdAt: -1 };

  const messages = await Message.find({ ...mongoFilter, room: roomId })
    .sort(mongoSort)
    .populate("user")
    .limit(perPage)
    .skip(perPage * page);

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
      type: joi
        .string()
        .valid("TEXT", "IMAGE", "VIDEO", "AUDIO")
        .default("TEXT"),
      content: joi.when("type", {
        is: joi.string().valid("TEXT"),
        then: joi.string().max(5000).required(),
        otherwise: joi.invalid(),
      }),
      attachment: joi.when("type", {
        is: joi.string().valid("IMAGE", "VIDEO", "AUDIO"),
        then: joi.string().hex().length(24).required(),
        otherwise: joi.invalid(),
      }),
      room: joi.string().hex().length(24).required(),
      user: joi.string().hex().length(24).required(),
    }),
    doc
  );

  const message = await Message.create(doc);
  await message.populate("user");

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
    throw new ApiError("Resource not found", 404, ApiErrorCode.NOT_FOUND_ERROR);
  }
};
