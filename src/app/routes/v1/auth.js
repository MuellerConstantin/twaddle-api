import express from 'express';
import env from '../../config/env';
import {authenticateCredentials, authenticateRefreshToken} from '../../middlewares/security';
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
      type: 'Bearer',
      accessToken,
      accessExpiresIn: env.authToken.expires,
      refreshToken,
      refreshExpiresIn: env.refreshToken.expires,
      principal: {
        id: req.user.id,
        email: req.user.email,
        displayName: req.user.displayName,
        verified: req.user.verified,
      },
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
      type: 'Bearer',
      accessToken,
      accessExpiresIn: env.authToken.expires,
      refreshToken,
      refreshExpiresIn: env.refreshToken.expires,
      principal: {
        id: req.user.id,
        email: req.user.email,
        displayName: req.user.displayName,
        verified: req.user.verified,
      },
    });
  }),
);

export default router;
