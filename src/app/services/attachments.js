import joi from "joi";
import fs from "fs";
import { ApiError, ApiErrorCode } from "../middlewares/error";
import { validate } from "../middlewares/validation";
import { parse as parseRsql } from "../middlewares/rsql";
import { parse as parseSort } from "../middlewares/sorting";
import Attachment from "../models/attachment";

/**
 * @typedef {object} AttachmentDTO
 * @property {string} id
 * @property {string} path
 * @property {string} mimeType
 * @property {number} size
 */

/**
 * @typedef {object} PageInfo
 * @property {number} page
 * @property {number} perPage
 * @property {number} totalPages
 * @property {number} totalElements
 */

/**
 * Finds an attachment's meta information by its identifier.
 *
 * @param {string} id Identifier to search for
 * @returns {Promise<AttachmentDTO>} Returns the fetched meta information
 */

export const findById = async (id) => {
  const attachment = await Attachment.findById(id);

  if (!attachment) {
    throw new ApiError("Resource not found", 404, ApiErrorCode.NOT_FOUND_ERROR);
  }

  return attachment.toDTO();
};

/**
 * Find all available atachments paged.
 *
 * @param {string=} filter RSQL query filter
 * @param {string=} sort Sorting instruction
 * @param {{perPage: number, page: number}=} pageable Pagination settings
 * @returns {Promise<[[AttachmentDTO], PageInfo]>} Returns the fetched page
 */
export const findAll = async (
  filter,
  sort,
  pageable = { perPage: 25, page: 0 }
) => {
  const { perPage, page } = pageable;

  const mongoFilter = filter ? parseRsql(filter) : {};
  const mongoSort = sort ? parseSort(sort) : { createdAt: -1 };

  const attachments = await Attachment.find(mongoFilter)
    .sort(mongoSort)
    .limit(perPage)
    .skip(perPage * page);

  const totalAttachments = await Attachment.count();

  const info = {
    page,
    perPage,
    totalPages: Math.ceil(totalAttachments / perPage),
    totalElements: totalAttachments,
  };

  const content = attachments.map((attachment) => attachment.toDTO());

  return [content, info];
};

/**
 * Creates a new attachment.
 *
 * @param {object} doc Fields of new attachment to create
 * @returns {Promise<MessageDTO>} Returns the created attachment
 */
export const create = async (doc) => {
  validate(
    joi.object({
      path: joi.string().required(),
      mimeType: joi.string().required(),
      size: joi.number().integer().positive().required(),
    }),
    doc
  );

  const attachment = await Attachment.create(doc);
  return attachment.toDTO();
};

/**
 * Finds an attachment and deletes it.
 *
 * @param {string} id Identifier to search for
 * @returns {Promise<void>} Returns nothing on success
 */
export const deleteById = async (id) => {
  const attachment = await Attachment.findByIdAndDelete(id);

  if (!attachment) {
    throw new ApiError("Resource not found", 404, ApiErrorCode.NOT_FOUND_ERROR);
  }

  // Delete also actual attachment in file storage
  fs.unlinkSync(attachment.path);
};
