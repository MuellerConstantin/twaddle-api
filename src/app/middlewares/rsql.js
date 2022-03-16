import { parse as parseRsql } from "@rsql/parser";
import { ApiError, ApiErrorCode } from "./error";

const resolveComparisonOperator = (operator) => {
  switch (operator) {
    case "==": {
      return "$eq";
    }
    case "!=": {
      return "$ne";
    }
    case "<":
    case "=lt=": {
      return "$lt";
    }
    case ">":
    case "=gt=": {
      return "$gt";
    }
    case "<=":
    case "=le=": {
      return "$lte";
    }
    case ">=":
    case "=ge=": {
      return "$gte";
    }
    case "=in=": {
      return "$in";
    }
    case "=out=": {
      return "$nin";
    }
    case "=like=": {
      return "$regex";
    }
    default: {
      throw new ApiError(
        "Invalid query language comparison operator",
        400,
        ApiErrorCode.REST_QUERY_LANGUAGE_ERROR
      );
    }
  }
};

const resolveLogicOperator = (operator) => {
  switch (operator) {
    case ";":
    case "and": {
      return "$and";
    }
    case ",":
    case "or": {
      return "$or";
    }
    default: {
      throw new ApiError(
        "Invalid query language logic operator",
        400,
        ApiErrorCode.REST_QUERY_LANGUAGE_ERROR
      );
    }
  }
};

const parseComparison = (comparison) => {
  let operator = null;
  let selector = null;
  let value = null;

  selector =
    comparison.left.selector === "id" ? "_id" : comparison.left.selector;
  value = comparison.right.value;
  operator = resolveComparisonOperator(comparison.operator);

  return {
    [selector]: { [operator]: value },
  };
};

const parseLogic = (logic) => {
  let operator = null;
  let left = null;
  let right = null;

  operator = resolveLogicOperator(logic.operator);

  if (logic.left.type === "LOGIC") {
    left = parseLogic(logic.left);
  } else if (logic.left.type === "COMPARISON") {
    left = parseComparison(logic.left);
  } else {
    throw new ApiError(
      "Invalid query language type",
      400,
      ApiErrorCode.REST_QUERY_LANGUAGE_ERROR
    );
  }

  if (logic.right.type === "LOGIC") {
    right = parseLogic(logic.right);
  } else if (logic.right.type === "COMPARISON") {
    right = parseComparison(logic.right);
  } else {
    throw new ApiError(
      "Invalid query language type",
      400,
      ApiErrorCode.REST_QUERY_LANGUAGE_ERROR
    );
  }

  return { [operator]: [left, right] };
};

const parseAst = (ast) => {
  let query = null;

  if (ast.type === "LOGIC") {
    query = parseLogic(ast);
  } else if (ast.type === "COMPARISON") {
    query = parseComparison(ast);
  } else {
    throw new ApiError(
      "Invalid query language type",
      400,
      ApiErrorCode.REST_QUERY_LANGUAGE_ERROR
    );
  }

  return query;
};

/**
 * Translates an RSQL query into a MongoDB query.
 *
 * @param {string} rsql RSQL query to parse
 * @returns {object} Returns the translated MongoDB query
 */
// eslint-disable-next-line import/prefer-default-export
export const parse = (rsql) => {
  let ast;

  try {
    ast = parseRsql(rsql);
  } catch (err) {
    throw new ApiError(
      "Invalid query language syntax",
      400,
      ApiErrorCode.REST_QUERY_LANGUAGE_ERROR
    );
  }

  return parseAst(ast);
};
