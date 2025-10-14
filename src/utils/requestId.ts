import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Request interface to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Middleware to generate and attach a unique request ID to each request
 * This helps with tracing requests through logs and debugging
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Generate a unique request ID
  req.requestId = randomUUID();
  
  // Add request ID to response headers for client-side tracking
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
};

/**
 * Get request ID from request object
 */
export const getRequestId = (req: Request): string => {
  return req.requestId || 'unknown';
};
