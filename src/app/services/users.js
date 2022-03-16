import joi from "joi";
import { ApiError, ApiErrorCode } from "../middlewares/error";
import { validate } from "../middlewares/validation";
import { parse as parseRsql } from "../middlewares/rsql";
import User from "../models/user";
import redis from "../config/redis";

/**
 * @typedef {object} UserDTO
 * @property {string} id
 * @property {string} username
 * @property {string} email
 */

/**
 * @typedef {object} ProfileDTO
 * @property {string} id
 * @property {string} username
 */

/**
 * @typedef {object} PageInfo
 * @property {number} page
 * @property {number} perPage
 * @property {number} totalPages
 * @property {number} totalElements
 */

/**
 * Finds an user by its username.
 *
 * @param {string} username Username to search for
 * @param {"profile"=} view User view to load
 * @returns {Promise<ProfileDTO|UserDTO>} Returns the fetched user
 */

export const findByUsername = async (username, view) => {
  const user = await User.findOne({ username });

  if (!user) {
    throw new ApiError("Resource not found", 404, ApiErrorCode.NOT_FOUND_ERROR);
  }

  return user.toDTO(view);
};

/**
 * Find all available users paged.
 *
 * @param {string=} filter RSQL query filter
 * @param {{perPage: number, page: number}=} pageable Pagination settings
 * @param {"profile"=} view User view to load
 * @returns {Promise<[[ProfileDTO|UserDTO], PageInfo]>} Returns the fetched page
 */
export const findAll = async (
  filter,
  pageable = { perPage: 25, page: 0 },
  view = undefined
) => {
  const { perPage, page } = pageable;

  const mongoFilter = filter ? parseRsql(filter) : {};

  const users = await User.find(mongoFilter)
    .limit(perPage)
    .skip(perPage * page)
    .sort({ username: 1 });

  const totalUsers = await User.count(mongoFilter);

  const info = {
    page,
    perPage,
    totalPages: Math.ceil(totalUsers / perPage),
    totalElements: totalUsers,
  };

  const content = users.map((user) => user.toDTO(view));

  return [content, info];
};

/**
 * Creates a new user.
 *
 * @param {object} doc Fields of new user to create
 * @param {"profile"=} view User view to load
 * @returns {Promise<ProfileDTO|UserDTO>} Returns the created user
 */
export const create = async (doc, view) => {
  validate(
    joi.object({
      username: joi
        .string()
        .min(4)
        .max(15)
        .regex(/^[a-zA-Z]+(?:[_-]?[a-zA-Z0-9])*$/)
        .required(),
      email: joi.string().email().required(),
      password: joi
        .string()
        .min(6)
        .max(50)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/)
        .required(),
    }),
    doc
  );

  if (await User.exists({ username: doc.username })) {
    throw new ApiError(
      "Username is already in use",
      409,
      ApiErrorCode.USERNAME_ALREAY_IN_USE_ERROR
    );
  }

  if (await User.exists({ email: doc.email })) {
    throw new ApiError(
      "Email is already in use",
      409,
      ApiErrorCode.EMAIL_ALREADY_IN_USE_ERROR
    );
  }

  const data = doc;
  // Ensures that the first created user get administrative privileges
  data.role = (await User.countDocuments()) === 0 ? "ADMINISTRATOR" : "MEMBER";

  const user = await User.create(data);
  return user.toDTO(view);
};

/**
 * Finds an user and updates it.
 *
 * @param {string} username Username to search for
 * @param {object} doc Fields of user to update
 * @param {"profile"=} view User view to load
 * @returns {Promise<ProfileDTO|UserDTO>} Returns the updated user
 */
export const updateByUsername = async (username, doc, view) => {
  validate(
    joi.object({
      email: joi.string().email().optional(),
      password: joi
        .string()
        .min(6)
        .max(50)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/)
        .optional(),
      role: joi
        .string()
        .valid("ADMINISTRATOR", "MODERATOR", "MEMBER")
        .optional(),
      blocked: joi.boolean().optional(),
    }),
    doc
  );

  if (doc.email && (await User.exists({ email: doc.email }))) {
    throw new ApiError(
      "Email is already in use",
      409,
      ApiErrorCode.EMAIL_ALREADY_IN_USE_ERROR
    );
  }

  if (
    doc.blocked &&
    !(await User.exists({ role: "ADMINISTRATOR", username: { $ne: username } }))
  ) {
    throw new ApiError(
      "Blocking the last administrator is not allowed",
      409,
      ApiErrorCode.MUST_BE_ADMINISTRABLE_ERROR
    );
  }

  if (
    doc.role &&
    !(await User.exists({ role: "ADMINISTRATOR", username: { $ne: username } }))
  ) {
    throw new ApiError(
      "Removing the last administrator is not allowed",
      409,
      ApiErrorCode.MUST_BE_ADMINISTRABLE_ERROR
    );
  }

  const update = { $set: {}, $unset: {} };

  Object.keys(doc).forEach((key) => {
    update.$set[key] = doc[key];

    if (key === null) {
      update.$unset[key] = 1;
    }
  });

  const user = await User.findOneAndUpdate({ username }, update, {
    new: true,
  });

  if (!user) {
    throw new ApiError("Resource not found", 404, ApiErrorCode.NOT_FOUND_ERROR);
  }

  return user.toDTO(view);
};

/**
 * Finds an user and deletes it.
 *
 * @param {string} username Username to search for
 * @returns {Promise<void>} Returns nothing on success
 */
export const deleteByUsername = async (username) => {
  if (
    !(await User.exists({ role: "ADMINISTRATOR", username: { $ne: username } }))
  ) {
    throw new ApiError(
      "Removing the last administrator is not allowed",
      409,
      ApiErrorCode.MUST_BE_ADMINISTRABLE_ERROR
    );
  }

  const user = await User.findOneAndDelete({ username });

  if (!user) {
    throw new ApiError("Resource not found", 404, ApiErrorCode.NOT_FOUND_ERROR);
  }
};

/**
 * Check if a user is online, therefore has an active connection open.
 *
 * @param {string} username Name of user to check for
 * @returns {Promise<boolean>} Returns true if online, otherwise false
 */
export const isOnline = async (username) => {
  return !!(await redis.get(`user:${username}`));
};

/**
 * Tries to lock the user as online.
 *
 * The online status is set according to the mutex principle: The user is
 * set online for a defined period of time. A second attempt to put the user
 * online again fails. After the period has expired, the status expires. To
 * prevent this, the status must be renewed. See {@link confirmOnlineStatusLock}
 * for details about renewing the status.
 *
 * @param {string} username Name of user to lock as online
 * @returns {Promise<string|null>} Confirms success by sending anything other than null
 */
export const lockOnlineStatus = async (username) => {
  return redis.set(`user:${username}:online`, 1, { NX: true, EX: 30 });
};

/**
 * Refresh the locked online status. Please note refresh is only possible if lock exists.
 *
 * @param {string} username Name of user to refresh locked online status
 * @returns {Promise<string|null>} Confirms success by sending anything other than null
 */
export const confirmOnlineStatusLock = async (username) => {
  return redis.set(`user:${username}:online`, 1, { XX: true, EX: 30 });
};

/**
 * Unlock user as online. This is basically the logout operation.
 *
 * @param {string} username Name of user to unlock as online
 * @returns {Promise<void>} Returns nothing on success
 */
export const unlockOnlineStatus = async (username) => {
  await redis.del(`user:${username}:online`);
};
