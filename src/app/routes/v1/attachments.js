import express from "express";
import fs from "fs";
import { readFile } from "fs/promises";
import joi from "joi";
import multer from "../../config/multer";
import { asyncHandler, ApiError, ApiErrorCode } from "../../middlewares/error";
import { authenticateToken } from "../../middlewares/authentication";
import { authorize } from "../../middlewares/authorization";
import { paramsValidationHandler } from "../../middlewares/validation";
import * as AttachmentService from "../../services/attachments";

const router = express.Router();

router.get(
  "/attachments/:id",
  authenticateToken(),
  paramsValidationHandler(
    joi.object().keys({
      id: joi.string().hex().length(24).required(),
    })
  ),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const attachment = await AttachmentService.findById(id);
    return res.status(200).json(attachment);
  })
);

router.get(
  "/attachments/:id/raw",
  authenticateToken(),
  paramsValidationHandler(
    joi.object().keys({
      id: joi.string().hex().length(24).required(),
    })
  ),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const attachment = await AttachmentService.findById(id);

    if (!fs.existsSync(attachment.path)) {
      throw new ApiError(
        "Resource not found",
        404,
        ApiErrorCode.NOT_FOUND_ERROR
      );
    }

    const content = await readFile(attachment.path);

    return res
      .status(200)
      .header("Content-Type", attachment.mimeType)
      .send(content);
  })
);

router.post(
  "/attachments",
  authenticateToken(),
  multer.single("file"),
  asyncHandler(async (req, res) => {
    const attachment = await AttachmentService.create({
      path: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    return (
      res
        .status(201)
        // eslint-disable-next-line no-underscore-dangle
        .location(`${req.originalUrl}/${encodeURIComponent(attachment.id)}`)
        .json(attachment)
    );
  })
);

router.delete(
  "/attachments/:id",
  authenticateToken(),
  authorize((req) => req.user?.role === "ADMINISTRATOR"),
  paramsValidationHandler(
    joi.object().keys({ id: joi.string().hex().length(24).required() })
  ),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await AttachmentService.deleteById(id);
    return res.status(204).send();
  })
);

export default router;
