import { Request, Response, NextFunction } from 'express';
import { logger } from './logger.js';
import { getRequestId } from './requestId.js';

/**
 * Middleware to log incoming requests and outgoing responses
 * This helps with debugging and monitoring API usage
 */
export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = getRequestId(req);
  const startTime = Date.now();
  
  // Log incoming request
  logger.logRequest(req, requestId);
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.logResponse(req, res, requestId, duration);
    
    // Call original end method
    return originalEnd.call(this, chunk, encoding, cb);
  };
  
  next();
};
