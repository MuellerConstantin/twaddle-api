import joi from "joi";
import { ApiError } from "../middlewares/error";
import { validate } from "../middlewares/validation";
import User from "../models/user";

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
    throw new ApiError("Resource not found", 404, "NotFoundError");
  }

  return user.toDTO(view);
};

/**
 * Find all available users paged.
 *
 * @param {{perPage: number, page: number}=} pageable
 * @param {"profile"=} view User view to load
 * @returns {Promise<[[ProfileDTO|UserDTO], PageInfo]>} Returns the fetched page
 */
export const findAll = async (
  pageable = { perPage: 25, page: 0 },
  view = undefined
) => {
  const { perPage, page } = pageable;

  const users = await User.find()
    .limit(perPage)
    .skip(perPage * page)
    .sort({ username: 1 });

  const totalUsers = await User.count();

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
      "UsernameAlreadyInUseError"
    );
  }

  if (await User.exists({ email: doc.email })) {
    throw new ApiError(
      "Email is already in use",
      409,
      "EmailAlreadyInUseError"
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
        .required(),
    }),
    doc
  );

  if (doc.email && (await User.exists({ email: doc.email }))) {
    throw new ApiError(
      "Email is already in use",
      409,
      "EmailAlreadyInUseError"
    );
  }

  if (
    doc.role &&
    !(await User.exists({ role: "ADMINISTRATOR", username: { $ne: username } }))
  ) {
    throw new ApiError(
      "Removing the last administrator is not allowed",
      409,
      "MustBeAdministrableError"
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
    throw new ApiError("Resource not found", 404, "NotFoundError");
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
      "MustBeAdministrableError"
    );
  }

  const user = await User.findOneAndDelete({ username });

  if (!user) {
    throw new ApiError("Resource not found", 404, "NotFoundError");
  }
};
