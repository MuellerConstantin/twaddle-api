import express from "express";
import joi from "joi";
import { asyncHandler } from "../../middlewares/error";
import { authenticateToken } from "../../middlewares/authentication";
import { authorize } from "../../middlewares/authorization";
import {
  paramsValidationHandler,
  queryValidationHandler,
} from "../../middlewares/validation";
import * as UserService from "../../services/users";

const router = express.Router();

router.get(
  "/users/:username",
  authenticateToken(),
  authorize(
    (req) =>
      req.user?.role === "ADMINISTRATOR" ||
      req.user?.username === req.params.username
  ),
  paramsValidationHandler(
    joi.object().keys({ username: joi.string().required() })
  ),
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    const user = await UserService.findByUsername(username, "account");
    return res.status(200).json(user);
  })
);

router.get(
  "/users",
  authenticateToken(),
  authorize((req) => req.user?.role === "ADMINISTRATOR"),
  queryValidationHandler(
    joi.object({
      perPage: joi.number().positive().greater(0).default(25).optional(),
      page: joi.number().positive().allow(0).default(0).optional(),
      filter: joi.string().optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const { perPage, page, filter } = req.query;
    const [content, info] = await UserService.findAll(filter, {
      perPage,
      page,
    });

    return res.status(200).json({ content, info });
  })
);

router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const user = await UserService.create(req.body);

    return (
      res
        .status(201)
        // eslint-disable-next-line no-underscore-dangle
        .location(`${req.originalUrl}/${encodeURIComponent(user.id)}`)
        .json(user)
    );
  })
);

router.patch(
  "/users/:username",
  authenticateToken(),
  authorize(
    (req) =>
      req.user?.role === "ADMINISTRATOR" ||
      req.user?.username === req.params.username
  ),
  // Only moderators and admins can block or unblock users
  authorize((req) =>
    req.body.blocked
      ? req.user?.role === "ADMINISTRATOR" || req.user?.role === "MODERATOR"
      : true
  ),
  // Only administrators can change the role of users
  authorize((req) =>
    req.body.role ? req.user?.role === "ADMINISTRATOR" : true
  ),
  paramsValidationHandler(
    joi.object().keys({ username: joi.string().required() })
  ),
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    const user = await UserService.updateByUsername(username, req.body);

    return res.status(200).json(user);
  })
);

router.delete(
  "/users/:username",
  authenticateToken(),
  authorize(
    (req) =>
      req.user?.role === "ADMINISTRATOR" ||
      req.user?.username === req.params.username
  ),
  paramsValidationHandler(
    joi.object().keys({ username: joi.string().required() })
  ),
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    await UserService.deleteByUsername(username);
    return res.status(204).send();
  })
);

export default router;
