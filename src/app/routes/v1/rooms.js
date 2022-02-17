import express from "express";
import joi from "joi";
import { asyncHandler } from "../../middlewares/error";
import { authenticateToken } from "../../middlewares/authentication";
import { authorize } from "../../middlewares/authorization";
import {
  paramsValidationHandler,
  queryValidationHandler,
} from "../../middlewares/validation";
import * as RoomService from "../../services/rooms";

const router = express.Router();

router.get(
  "/rooms/:id",
  authenticateToken(),
  paramsValidationHandler(
    joi.object().keys({ id: joi.string().hex().length(24).required() })
  ),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const room = await RoomService.findById(id);
    return res.status(200).json(room);
  })
);

router.get(
  "/rooms",
  authenticateToken(),
  queryValidationHandler(
    joi.object({
      perPage: joi.number().positive().greater(0).default(25).optional(),
      page: joi.number().positive().allow(0).default(0).optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const { perPage, page } = req.query;
    const [content, info] = await RoomService.findAll({ perPage, page });

    return res.status(200).json({ content, info });
  })
);

router.post(
  "/rooms",
  authenticateToken(),
  authorize((req) => req.user?.role === "ADMINISTRATOR"),
  asyncHandler(async (req, res) => {
    const room = await RoomService.create(req.body);

    return (
      res
        .status(201)
        // eslint-disable-next-line no-underscore-dangle
        .location(`${req.originalUrl}/${encodeURIComponent(room.id)}`)
        .json(room)
    );
  })
);

router.patch(
  "/rooms/:id",
  authenticateToken(),
  authorize((req) => req.user?.role === "ADMINISTRATOR"),
  paramsValidationHandler(
    joi.object().keys({ id: joi.string().hex().length(24).required() })
  ),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const room = await RoomService.updateById(id, req.body);

    return res.status(200).json(room);
  })
);

router.delete(
  "/rooms/:id",
  authenticateToken(),
  authorize((req) => req.user?.role === "ADMINISTRATOR"),
  paramsValidationHandler(
    joi.object().keys({ id: joi.string().hex().length(24).required() })
  ),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await RoomService.deleteById(id);
    return res.status(204).send();
  })
);

export default router;
