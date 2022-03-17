import express from "express";
import joi from "joi";
import { authenticateToken } from "../../middlewares/authentication";
import { asyncHandler } from "../../middlewares/error";
import {
  paramsValidationHandler,
  queryValidationHandler,
} from "../../middlewares/validation";
import * as UserService from "../../services/users";

const router = express.Router();

router.get(
  "/profiles/:username",
  authenticateToken(),
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
  authenticateToken(),
  queryValidationHandler(
    joi.object({
      perPage: joi.number().positive().greater(0).default(25).optional(),
      page: joi.number().positive().allow(0).default(0).optional(),
      filter: joi.string().optional(),
      sort: joi
        .string()
        .regex(/^[A-Za-z0-9_-]+,(asc|desc)$/)
        .optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const { perPage, page, filter, sort } = req.query;
    const [content, info] = await UserService.findAll(
      filter,
      sort,
      { perPage, page },
      "profile"
    );

    return res.status(200).json({ content, info });
  })
);

export default router;
