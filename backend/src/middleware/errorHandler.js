import { logger } from '../config/logger.js';
import { config } from '../config/environment.js';

export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 Not Found Middleware
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Endpoint not found: ${req.method} ${req.originalUrl}`);
  next(error);
};

// Central Error Handling Middleware
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${err.message} \n${err.stack}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${statusCode} - ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: err.code || 'API_ERROR',
      details: err.details || null,
      ...(config.env === 'development' && { stack: err.stack }),
    },
  });
};
