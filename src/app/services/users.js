import path from 'path';
import {randomBytes} from 'crypto';
import joi from 'joi';
import ejs from 'ejs';
import bcrypt from 'bcryptjs';
import env from '../config/env';
import redis from '../config/redis';
import {sendHtmlMail} from '../config/nodemailer';
import {validateData} from '../middlewares/validation';
import {ApiError} from '../middlewares/error';
import User from '../models/user';

/**
 * Retrieves a single user by its identifier.
 *
 * @param {string} id Identifier of the user to retrieve
 * @return {Promise<object>} The retrieved user
 */
export async function findUserById(id) {
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError('Resource not found', 404);
  }

  return user;
}

/**
 * Retrieves a single user by its email.
 *
 * @param {string} email Email of the user to retrieve
 * @return {Promise<object>} The retrieved user
 */
export async function findUserByEmail(email) {
  const user = await User.findOne({email});

  if (!user) {
    throw new ApiError('Resource not found', 404);
  }

  return user;
}

/**
 * Retrieves all users in a paginated form.
 *
 * @param {{perPage: number, page: number}=} pageable Page number
 * @return {Promise<[object[], object]>} Returns a tuple with the list of users and pagination info
 */
export async function findUsers(pageable = {perPage: 25, page: 0}) {
  const {perPage, page} = pageable;

  const users = await User.find()
    .limit(perPage)
    .skip(perPage * page);

  const totalUsers = await User.count();

  const info = {
    page,
    perPage,
    totalPages: Math.ceil(totalUsers / perPage),
    totalElements: totalUsers,
  };

  return [users, info];
}

/**
 * Creates a new user.
 *
 * @param {object} data Fields of new user to create
 * @return {Promise<object>} Returns the created user
 */
export async function createUser(data) {
  validateData(
    joi.object({
      email: joi.string().email().required(),
      password: joi
        .string()
        .min(6)
        .max(50)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/)
        .required(),
      displayName: joi.string().min(4).max(150).required(),
    }),
    data,
  );

  if (await User.exists({email: data.email})) {
    throw new ApiError('Email is already in use', 409);
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(data.password, salt);

  data.password = hash;

  const user = await User.create(data);

  sendVerificationMail(user.id);

  return user;
}

/**
 * Updates a user.
 *
 * @param {string} id Identifier of user to update
 * @param {object} data Fields of user to update
 * @return {Promise<object>} Returns the updated user
 */
export async function updateUser(id, data) {
  validateData(
    joi.object({
      email: joi.string().email().optional(),
      password: joi
        .string()
        .min(6)
        .max(50)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/)
        .optional(),
      displayName: joi.string().min(4).max(150).optional(),
    }),
    data,
  );

  const update = {$set: {}, $unset: {}};

  Object.keys(data).forEach((key) => {
    if (key === 'password') {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(data[key], salt);

      update.$set[key] = hash;
    } else if (key === 'email') {
      update.$set[key] = data[key];
      update.$set.verified = false;
    } else {
      update.$set[key] = data[key];
    }

    if (data[key] === null) {
      update.$unset[key] = 1;
    }
  });

  const user = await User.findByIdAndUpdate(id, update, {
    new: true,
  });

  if (!user) {
    throw new ApiError('Resource not found', 404);
  }

  return user;
}

/**
 * Deletes a user.
 *
 * @param {string} id Identifier of user to update
 */
export async function deleteUser(id) {
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    throw new ApiError('Resource not found', 404);
  }
}

/**
 * Sends a verification mail to the user.
 *
 * @param {string} userId The user's identifier
 */
export async function sendVerificationMail(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError('Resource not found', 404);
  }

  if (user.verified) {
    throw new ApiError('User already verified', 400);
  }

  const verificationToken = randomBytes(6).toString('hex');

  await redis.set(`verificationToken:${verificationToken}`, userId, {
    EX: env.verificationToken.expires,
  });

  const html = await ejs.renderFile(path.join(__dirname, '../../../resources/mail/verification.ejs'), {
    displayName: user.displayName,
    verificationToken,
  });

  await sendHtmlMail(user.email, '"Twaddle Team" <noreply@twaddle.com>', 'Activate your account', html);
}

/**
 * Verifies a user's email address and activates the account.
 *
 * @param {string} verificationToken The verification token received by email
 */
export async function verifyUser(verificationToken) {
  const userId = await redis.get(`verificationToken:${verificationToken}`);

  if (!userId) {
    throw new ApiError('Resource not found', 404);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        verified: true,
      },
    },
    {new: true},
  );

  if (!user) {
    throw new ApiError('Resource not found', 404);
  }

  await redis.del(`verificationToken:${verificationToken}`);
}
