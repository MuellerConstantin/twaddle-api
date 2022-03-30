import express from "express";
import joi from "joi";
import { asyncHandler } from "../../middlewares/error";
import { authenticateToken } from "../../middlewares/authentication";
import {
  paramsValidationHandler,
  queryValidationHandler,
} from "../../middlewares/validation";
import * as MessageService from "../../services/messages";

const router = express.Router();

router.get(
  "/messages/:id",
  authenticateToken(),
  paramsValidationHandler(
    joi.object().keys({
      id: joi.string().hex().length(24).required(),
    })
  ),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const message = await MessageService.findById(id);
    return res.status(200).json(message);
  })
);

router.get(
  "/rooms/:roomId/messages",
  authenticateToken(),
  paramsValidationHandler(
    joi.object().keys({ roomId: joi.string().hex().length(24).required() })
  ),
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
    const { roomId } = req.params;
    const { perPage, page, filter, sort } = req.query;

    const [content, info] = await MessageService.findAllByRoom(
      roomId,
      filter,
      sort,
      {
        perPage,
        page,
      }
    );

    return res.status(200).json({ content, info });
  })
);

export default router;
