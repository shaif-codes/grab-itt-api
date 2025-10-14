import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ResponseUtil, ERROR_TYPES, ERROR_CODES } from './response.js';
import { logger } from './logger.js';
import { getRequestId } from './requestId.js';

// Custom error class for application-specific errors
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorType: string;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorType: string = ERROR_TYPES.INTERNAL_ERROR,
    errorCode: string = ERROR_CODES.DATABASE_CONNECTION_FAILED,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = (
  error: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = getRequestId(req);
  
  // Log the error
  logger.logError(req, error, requestId);
  
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
    
    ResponseUtil.validationError(
      res,
      'Validation failed',
      validationErrors
    );
    return;
  }
  
  // Handle custom AppError
  if (error instanceof AppError) {
    ResponseUtil.error(
      res,
      error.message,
      error.errorType,
      error.errorCode,
      error.statusCode,
      error.details
    );
    return;
  }
  
  // Handle unexpected errors
  logger.error('Unexpected error occurred', error, {
    requestId,
    url: req.url,
    method: req.method,
    userId: (req as any).user?.id
  });
  
  ResponseUtil.internalError(
    res,
    'An unexpected error occurred',
    ERROR_CODES.DATABASE_CONNECTION_FAILED,
    process.env.NODE_ENV === 'development' ? error.message : undefined
  );
};

// Async error wrapper to catch async errors in route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response): void => {
  const requestId = getRequestId(req);
  
  logger.warn('Route not found', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  
  ResponseUtil.notFound(
    res,
    `Route ${req.method} ${req.url} not found`,
    'ROUTE_NOT_FOUND'
  );
};
