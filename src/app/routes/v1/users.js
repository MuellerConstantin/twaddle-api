import express from 'express';
import joi from 'joi';
import {asyncHandler} from '../../middlewares/error';
import {paramsValidationHandler, queryValidationHandler} from '../../middlewares/validation';
import {authenticateAccessToken} from '../../middlewares/security';
import * as UserService from '../../services/users';

// eslint-disable-next-line new-cap
const router = express.Router();

router.get(
  '/users/:id',
  authenticateAccessToken(),
  paramsValidationHandler(joi.object().keys({id: joi.string().hex().required()})),
  asyncHandler(async (req, res) => {
    const {id} = req.params;
    const user = await UserService.findUserById(id);

    return res.status(200).json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      location: user.location,
      status: user.status,
    });
  }),
);

router.get(
  '/users',
  authenticateAccessToken(),
  queryValidationHandler(
    joi.object({
      perPage: joi.number().positive().greater(0).default(25).optional(),
      page: joi.number().positive().allow(0).default(0).optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const {perPage, page} = req.query;
    const [users, info] = await UserService.findUsers({
      perPage,
      page,
    });

    return res.status(200).json({
      content: users.map((user) => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        location: user.location,
        status: user.status,
      })),
      info,
    });
  }),
);

router.post(
  '/users',
  asyncHandler(async (req, res) => {
    const user = await UserService.createUser(req.body);

    return res
      .status(201)
      .location(`${req.originalUrl}/${encodeURIComponent(user.id)}`)
      .json({
        id: user.id,
        username: user.username,
        email: user.email,
        verified: user.verified,
        displayName: user.displayName,
        location: user.location,
        status: user.status,
      });
  }),
);

router.patch(
  '/user/me',
  authenticateAccessToken(),
  asyncHandler(async (req, res) => {
    const user = await UserService.updateUser(req.user.id, req.body);

    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      verified: user.verified,
      displayName: user.displayName,
      location: user.location,
      status: user.status,
    });
  }),
);

router.delete(
  '/user/me',
  authenticateAccessToken(),
  asyncHandler(async (req, res) => {
    await UserService.deleteUser(req.user.id);

    return res.status(204).send();
  }),
);

router.get(
  '/user/me',
  authenticateAccessToken(),
  asyncHandler(async (req, res) => {
    const user = await UserService.findUserById(req.user.id);

    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      verified: user.verified,
      displayName: user.displayName,
      location: user.location,
      status: user.status,
    });
  }),
);

router.get(
  '/user/verify-user',
  queryValidationHandler(
    joi.object({
      email: joi.string().email().required(),
    }),
  ),
  asyncHandler(async (req, res) => {
    await UserService.sendUserVerificationMail(req.query.email);

    return res.status(204).end();
  }),
);

router.post(
  '/user/verify-user',
  asyncHandler(async (req, res) => {
    await UserService.verifyUser(req.body.verificationToken);

    return res.status(204).end();
  }),
);

router.get(
  '/user/reset-password',
  queryValidationHandler(
    joi.object({
      email: joi.string().email().required(),
    }),
  ),
  asyncHandler(async (req, res) => {
    await UserService.sendPasswordResetMail(req.query.email);

    return res.status(204).end();
  }),
);

router.post(
  '/user/reset-password',
  asyncHandler(async (req, res) => {
    await UserService.resetPassword(req.body.resetToken, req.body.password);

    return res.status(204).end();
  }),
);

export default router;
