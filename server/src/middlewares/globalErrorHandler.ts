import type { NextFunction, Request, Response } from "express";
import { CustomError } from "../utils/customError";
import {
  castErrorHandler,
  duplicateKeyErrorHandler,
  validationErrorHandler,
} from "../utils/handleError";

const errorResponse = (error: CustomError, res: Response) => {
  res.status(error.statusCode).json({
    status: error.status,
    statusCode: error.statusCode,
    message: error.message,
    errorCode: error.errorCode,
  });
};

export const globalErrorHandler = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.log(`
    🔴 ERROR OCCURRED:
    - Status: ${error?.status || "fail"}
    - Code: ${error?.statusCode || 500}
    - Message: ${error?.message || "Internal Server Error"}
    - Stack: ${error?.stack || "No stack available"}
  `);

  switch (true) {
    case error instanceof CustomError:
      errorResponse(error, res);
      break;

    case error.name === "CastError":
      const castError = castErrorHandler(error);
      errorResponse(castError, res);
      break;

    case error.code === 11000:
      const duplicateKeyError = duplicateKeyErrorHandler(error);
      errorResponse(duplicateKeyError, res);
      break;

    case error.name === "ValidationError":
      const validationError = validationErrorHandler(error);
      errorResponse(validationError, res);
      break;

    default:
      // Default error handler if no case matches
      res.status(500).json({
        status: "fail",
        statusCode: 500,
        message: error?.message || "Something went wrong",
      });
  }
};
