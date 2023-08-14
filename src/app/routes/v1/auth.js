import express from 'express';
import env from '../../config/env';
import {authenticateCredentials, authenticateRefreshToken, authenticateAccessToken} from '../../middlewares/security';
import {asyncHandler} from '../../middlewares/error';
import * as AuthService from '../../services/auth';

// eslint-disable-next-line new-cap
const router = express.Router();

router.post(
  '/auth/credentials',
  authenticateCredentials(),
  asyncHandler(async (req, res) => {
    const accessToken = await AuthService.generateAccessToken(req.user.id);
    const refreshToken = await AuthService.generateRefreshToken(req.user.id);

    return res.status(201).json({
      accessToken,
      accessExpiresIn: env.authToken.expires,
      refreshToken,
      refreshExpiresIn: env.refreshToken.expires,
      subject: req.user.id,
    });
  }),
);

router.post(
  '/auth/refresh',
  authenticateRefreshToken(),
  asyncHandler(async (req, res) => {
    const accessToken = await AuthService.generateAccessToken(req.user.id);
    const refreshToken = await AuthService.generateRefreshToken(req.user.id);

    return res.status(201).json({
      accessToken,
      accessExpiresIn: env.authToken.expires,
      refreshToken,
      refreshExpiresIn: env.refreshToken.expires,
      subject: req.user.id,
    });
  }),
);

router.post(
  "/auth/tickets",
  authenticateAccessToken(),
  asyncHandler(async (req, res) => {
    const ticket = await AuthService.generateTicket(req.user.id);

    return res.status(201).json({
      ticket,
      subject: req.user.id,
      expires: env.ticket.expires,
    });
  })
);

export default router;
