import joi from "joi";
import { ApiError } from "../middlewares/error";
import { validate } from "../middlewares/validation";
import { parse as parseRsql } from "../middlewares/rsql";
import Room from "../models/room";
import redis from "../config/redis";

/**
 * @typedef {object} RoomDTO
 * @property {string} id
 * @property {string} name
 * @property {string=} description
 */

/**
 * @typedef {object} PageInfo
 * @property {number} page
 * @property {number} perPage
 * @property {number} totalPages
 * @property {number} totalElements
 */

/**
 * Finds an room by its identifier.
 *
 * @param {string} id Identifier to search for
 * @returns {Promise<RoomDTO>} Returns the fetched room
 */

export const findById = async (id) => {
  const room = await Room.findById(id);

  if (!room) {
    throw new ApiError("Resource not found", 404, "NotFoundError");
  }

  return room.toDTO();
};

/**
 * Find all available rooms paged.
 *
 * @param {string=} filter RSQL query filter
 * @param {{perPage: number, page: number}=} pageable Pagination settings
 * @returns {Promise<[[RoomDTO], PageInfo]>} Returns the fetched page
 */
export const findAll = async (filter, pageable = { perPage: 25, page: 0 }) => {
  const { perPage, page } = pageable;

  const mongoFilter = filter ? parseRsql(filter) : {};

  const rooms = await Room.find(mongoFilter)
    .limit(perPage)
    .skip(perPage * page)
    .sort({ name: 1 });

  const totalRooms = await Room.count();

  const info = {
    page,
    perPage,
    totalPages: Math.ceil(totalRooms / perPage),
    totalElements: totalRooms,
  };

  const content = rooms.map((room) => room.toDTO());

  return [content, info];
};

/**
 * Creates a new room.
 *
 * @param {object} doc Fields of new room to create
 * @returns {Promise<RoomDTO>} Returns the created room
 */
export const create = async (doc) => {
  validate(
    joi.object({
      name: joi.string().max(50).required(),
      description: joi.string().max(200).optional(),
    }),
    doc
  );

  if (await Room.exists({ name: doc.name })) {
    throw new ApiError(
      "Room name is already in use",
      409,
      "RoomNameAlreadyInUseError"
    );
  }

  const room = await Room.create(doc);
  return room.toDTO();
};

/**
 * Finds a room and updates it.
 *
 * @param {string} id Identifier to search for
 * @param {object} doc Fields of room to update
 * @returns {Promise<RoomDTO>} Returns the updated room
 */
export const updateById = async (id, doc) => {
  validate(
    joi.object({
      name: joi.string().max(50).optional(),
      description: joi.string().max(200).optional(),
    }),
    doc
  );

  if (doc.name && (await Room.exists({ name: doc.name }))) {
    throw new ApiError(
      "Room name is already in use",
      409,
      "RoomNameAlreadyInUseError"
    );
  }

  const update = { $set: {}, $unset: {} };

  Object.keys(doc).forEach((key) => {
    update.$set[key] = doc[key];

    if (key === null) {
      update.$unset[key] = 1;
    }
  });

  const room = await Room.findByIdAndUpdate(id, update, {
    new: true,
  });

  if (!room) {
    throw new ApiError("Resource not found", 404, "NotFoundError");
  }

  return room.toDTO();
};

/**
 * Finds a room and deletes it.
 *
 * @param {string} id Identifier to search for
 * @returns {Promise<void>} Returns nothing on success
 */
export const deleteById = async (id) => {
  const room = await Room.findByIdAndDelete(id);

  if (!room) {
    throw new ApiError("Resource not found", 404, "NotFoundError");
  }
};

/**
 * Add user to chat room.
 *
 * @param {string} id Identifier of room to look for
 * @param {string} username Name of user to add
 * @returns {Promise<void>} Returns nothing on success
 */
export const addRoomUser = async (id, username) => {
  await redis.sAdd(`room:${id}`, username);
  await redis.set(`user:${username}:room`, id);
};

/**
 * Remove user from chat room.
 *
 * @param {string} id Identifier of room to look for
 * @param {string} username Name of user to remove
 * @returns {Promise<void>} Returns nothing on success
 */
export const removeRoomUser = async (id, username) => {
  await redis.sRem(`room:${id}`, username);
  await redis.del(`user:${username}:room`);
};

/**
 * Get all users in room.
 *
 * @param {string} id Identifier of room to look for
 * @returns {Promise<string[]>} Returns names of all users in room
 */
export const getRoomUsers = async (id) => {
  return redis.sMembers(`room:${id}`);
};

/**
 * Get room by user
 *
 * @param {string} username Name of user to look for
 * @returns {Promise<string>} Returns names of the user's current room
 */
export const getRoomByUsername = async (username) => {
  return redis.get(`user:${username}:room`);
};
