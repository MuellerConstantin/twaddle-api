import express from "express";
import env from "../../config/env";
import { authenticateCredentials } from "../../middlewares/authentication";
import { asyncHandler } from "../../middlewares/error";
import * as TokenService from "../../services/tokens";

const router = express.Router();

router.post(
  "/tokens",
  authenticateCredentials(),
  asyncHandler(async (req, res) => {
    const token = TokenService.generateToken(req.user.username, {
      role: req.user.role,
    });

    return res.status(201).json({
      type: "Bearer",
      token,
      subject: req.user.username,
      expires: env.security.jwt.expires,
    });
  })
);

export default router;
