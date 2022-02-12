import express from "express";
import joi from "joi";
import { asyncHandler } from "../../middlewares/error";
import {
  paramsValidationHandler,
  queryValidationHandler,
} from "../../middlewares/validation";
import * as UserService from "../../services/users";

const router = express.Router();

router.get(
  "/profiles/:username",
  paramsValidationHandler(
    joi.object().keys({ username: joi.string().required() })
  ),
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    const user = await UserService.findByUsername(username, "profile");
    return res.status(200).json(user);
  })
);

router.get(
  "/profiles",
  queryValidationHandler(
    joi.object({
      perPage: joi.number().positive().greater(0).default(25).optional(),
      page: joi.number().positive().allow(0).default(0).optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const { perPage, page } = req.query;
    const [content, info] = await UserService.findAll(
      { perPage, page },
      "profile"
    );

    return res.status(200).json({ content, info });
  })
);

export default router;
