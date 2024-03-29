import path from 'path';
import {randomBytes} from 'crypto';
import joi from 'joi';
import ejs from 'ejs';
import bcrypt from 'bcryptjs';
import env from '../config/env';
import redis from '../config/redis';
import s3, {DeleteObjectCommand, GetObjectCommand} from '../config/s3';
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
export async function getUserById(id) {
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
export async function getUserByEmail(email) {
  const user = await User.findOne({email});

  if (!user) {
    throw new ApiError('Resource not found', 404);
  }

  return user;
}

/**
 * Retrieves a single user by its username.
 *
 * @param {string} username Username of the user to retrieve
 * @return {Promise<object>} The retrieved user
 */
export async function getUserByUsername(username) {
  const user = await User.findOne({username});

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
export async function getUsers(pageable = {perPage: 25, page: 0}) {
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
  data = validateData(
    joi.object({
      username: joi
        .string()
        .min(4)
        .max(50)
        .regex(/^[a-zA-Z0-9_]*$/)
        .required(),
      email: joi.string().email().required(),
      password: joi
        .string()
        .min(6)
        .max(50)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/)
        .required(),
      displayName: joi.string().min(1).max(150).optional(),
      location: joi.string().min(1).max(150).optional(),
      status: joi.string().min(1).max(150).optional(),
    }),
    data,
  );

  if (await User.exists({username: data.username})) {
    throw new ApiError('Username is already in use', 409);
  }

  if (await User.exists({email: data.email})) {
    throw new ApiError('Email is already in use', 409);
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(data.password, salt);

  data.password = hash;

  const user = await User.create(data);

  sendUserVerificationMail(user.email);

  return user;
}

/**
 * Updates a user's avatar.
 *
 * @param {string} id Identifier of user to update
 * @param {string} avatar Key of avatar in object storage
 */
export async function updateUserAvatar(id, avatar) {
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError('Resource not found', 404);
  }

  if (avatar === null) {
    if (user.avatar) {
      await s3.send(new DeleteObjectCommand({Bucket: env.s3.bucket, Key: user.avatar}));
    }

    await User.findByIdAndUpdate(
      id,
      {
        $unset: {
          avatar: 1,
        },
      },
      {new: true},
    );
  } else {
    if (user.avatar) {
      await s3.send(new DeleteObjectCommand({Bucket: env.s3.bucket, Key: user.avatar}));
    }

    await User.findByIdAndUpdate(
      id,
      {
        $set: {
          avatar,
        },
      },
      {new: true},
    );
  }
}

/**
 * Get a user's avatar.
 *
 * @param {string} id Identifier of user to retrieve avatar
 */
export async function getUserAvatar(id) {
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError('Resource not found', 404);
  }

  if (!user.avatar) {
    throw new ApiError('Resource not found', 404);
  }

  return await s3.send(new GetObjectCommand({Bucket: env.s3.bucket, Key: user.avatar}));
}

/**
 * Updates a user.
 *
 * @param {string} id Identifier of user to update
 * @param {object} data Fields of user to update
 * @return {Promise<object>} Returns the updated user
 */
export async function updateUser(id, data) {
  data = validateData(
    joi.object({
      username: joi
        .string()
        .min(4)
        .max(50)
        .regex(/^[a-zA-Z0-9_]*$/)
        .optional(),
      email: joi.string().email().optional(),
      password: joi
        .string()
        .min(6)
        .max(50)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/)
        .optional(),
      displayName: joi.string().min(1).max(150).allow(null).optional(),
      location: joi.string().min(1).max(150).allow(null).optional(),
      status: joi.string().min(1).max(150).allow(null).optional(),
    }),
    data,
  );

  const update = {$set: {}, $unset: {}};

  Object.keys(data).forEach((key) => {
    if (data[key] === null) {
      update.$unset[key] = 1;
    } else if (key === 'password') {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(data[key], salt);

      update.$set[key] = hash;
    } else if (key === 'email') {
      update.$set[key] = data[key];
      update.$set.verified = false;
    } else {
      update.$set[key] = data[key];
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
 * @param {string} email The user's email address
 */
export async function sendUserVerificationMail(email) {
  const user = await User.findOne({email});

  if (!user) {
    throw new ApiError('Resource not found', 404);
  }

  if (user.verified) {
    throw new ApiError('User already verified', 400);
  }

  const verificationToken = randomBytes(6).toString('hex');

  await redis.set(`verificationToken:${verificationToken}`, user.id, {
    EX: env.verificationToken.expires,
  });

  const html = await ejs.renderFile(path.join(__dirname, '../../../resources/mail/userVerification.ejs'), {
    displayName: user.displayName,
    verificationUrl: `${env.firstPartyClient.baseUrl}/verify-user/${verificationToken}`,
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

/**
 * Sends a password reset mail to the user.
 *
 * @param {string} email The user's email address
 */
export async function sendPasswordResetMail(email) {
  const user = await User.findOne({email});

  if (!user) {
    throw new ApiError('Resource not found', 404);
  }

  const resetToken = randomBytes(6).toString('hex');

  await redis.set(`resetToken:${resetToken}`, user.id, {
    EX: env.resetToken.expires,
  });

  const html = await ejs.renderFile(path.join(__dirname, '../../../resources/mail/passwordReset.ejs'), {
    displayName: user.displayName,
    resetUrl: `${env.firstPartyClient.baseUrl}/reset-password?token=${resetToken}`,
  });

  await sendHtmlMail(user.email, '"Twaddle Team" <noreply@twaddle.com>', 'Reset your password', html);
}

/**
 * Resets a user's password using a reset token.
 *
 * @param {string} resetToken The reset token received by email
 * @param {string} newPassword The new password
 */
export async function resetPassword(resetToken, newPassword) {
  const userId = await redis.get(`resetToken:${resetToken}`);

  if (!userId) {
    throw new ApiError('Resource not found', 404);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        password: bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10)),
      },
    },
    {new: true},
  );

  if (!user) {
    throw new ApiError('Resource not found', 404);
  }

  await redis.del(`resetToken:${resetToken}`);
}

/**
 * Check if a user is online, therefore has an active connection open.
 *
 * @param {string} id Identifier of user to check online status
 * @return {Promise<boolean>} Returns true if online, otherwise false
 */
export async function isOnline(id) {
  return !!(await redis.get(`user:${id}:online`));
}

/**
 * Mark a user as online.
 *
 * @param {string} id Identifier of user to mark as online
 * @return {Promise<string|null>} Confirms success by sending anything other than null
 */
export async function markOnline(id) {
  return redis.set(`user:${id}:online`, 1, {NX: true, EX: 30});
}

/**
 * Refresh the online status.
 *
 * @param {string} id Identifier of user to refresh online status
 * @return {Promise<string|null>} Confirms success by sending anything other than null
 */
export async function confirmOnline(id) {
  return redis.set(`user:${id}:online`, 1, {XX: true, EX: 30});
}

/**
 * Mark a user as offline.
 *
 * @param {string} id Identifier of user to mark as offline
 * @return {Promise<void>} Returns nothing on success
 */
export async function markOffline(id) {
  await redis.del(`user:${id}:online`);
}
