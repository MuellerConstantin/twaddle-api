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
      email: user.email,
      displayName: user.displayName,
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
        email: user.email,
        displayName: user.displayName,
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
        email: user.email,
        displayName: user.displayName,
      });
  }),
);

router.patch(
  '/users/:id',
  authenticateAccessToken(),
  paramsValidationHandler(joi.object().keys({id: joi.string().hex().required()})),
  asyncHandler(async (req, res) => {
    const {id} = req.params;
    const user = await UserService.updateUser(id, req.body);

    return res.status(200).json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    });
  }),
);

router.delete(
  '/users/:id',
  authenticateAccessToken(),
  paramsValidationHandler(joi.object().keys({id: joi.string().hex().required()})),
  asyncHandler(async (req, res) => {
    const {id} = req.params;
    await UserService.deleteUser(id);

    return res.status(204).send();
  }),
);

router.get(
  '/user',
  authenticateAccessToken(),
  asyncHandler(async (req, res) => {
    const user = await UserService.findUserById(req.user.id);

    return res.status(200).json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      verified: user.verified,
    });
  }),
);

router.get(
  '/user/verify',
  asyncHandler(async (req, res) => {
    await UserService.sendUserVerificationMail(req.query.email);

    return res.status(204).end();
  }),
);

router.post(
  '/user/verify',
  asyncHandler(async (req, res) => {
    await UserService.verifyUser(req.body.verificationToken);

    return res.status(204).end();
  }),
);

router.get(
  '/user/reset',
  asyncHandler(async (req, res) => {
    await UserService.sendPasswordResetMail(req.query.email);

    return res.status(204).end();
  }),
);

router.post(
  '/user/reset',
  asyncHandler(async (req, res) => {
    await UserService.resetPassword(req.body.resetToken, req.body.password);

    return res.status(204).end();
  }),
);

export default router;
