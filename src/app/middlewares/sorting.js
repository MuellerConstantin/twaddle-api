import { ApiError, ApiErrorCode } from "./error";

/**
 * Translates an sort instruction into a MongoDB sort option.
 *
 * @param {string} sort Sort instruction to parse
 * @returns {object} Returns the translated MongoDB query
 */
// eslint-disable-next-line import/prefer-default-export
export const parse = (sort) => {
  const [, field, sorting] = sort.match(/^([A-Za-z0-9_-]+),(asc|desc)$/);

  if (!field || !sorting) {
    throw new ApiError(
      "Invalid sorting instruction",
      400,
      ApiErrorCode.SORTING_INSTRUCTION_ERROR
    );
  }

  return { [field]: sorting === "asc" ? 1 : -1 };
};
