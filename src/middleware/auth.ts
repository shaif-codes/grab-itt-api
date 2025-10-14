import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ResponseUtil, ERROR_CODES, logger } from '../utils/index.js';

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'customer' | 'admin';
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      ResponseUtil.authenticationError(res, 'Access token required', ERROR_CODES.TOKEN_INVALID);
      return;
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        logger.warn('Authentication failed: Invalid token', {
          requestId: req.requestId,
          error: err.message,
          ip: req.ip
        });
        
        const errorCode = err.name === 'TokenExpiredError' 
          ? ERROR_CODES.TOKEN_EXPIRED 
          : ERROR_CODES.TOKEN_INVALID;
        
        ResponseUtil.authenticationError(res, 'Invalid or expired token', errorCode);
        return;
      }
      
      req.user = user;
      logger.debug('User authenticated successfully', {
        requestId: req.requestId,
        userId: user.id,
        userRole: user.role
      });
      next();
    });
  } catch (error) {
    logger.error('Authentication error', error as Error, {
      requestId: req.requestId,
      ip: req.ip
    });
    ResponseUtil.authenticationError(res, 'Authentication failed');
  }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      logger.warn('Authorization failed: No user in request', {
        requestId: req.requestId,
        ip: req.ip
      });
      ResponseUtil.authenticationError(res, 'Authentication required');
      return;
    }
    
    if (req.user.role !== 'admin') {
      logger.warn('Authorization failed: Insufficient privileges', {
        requestId: req.requestId,
        userId: req.user.id,
        userRole: req.user.role,
        ip: req.ip
      });
      ResponseUtil.authorizationError(res, 'Admin access required', ERROR_CODES.ADMIN_REQUIRED);
      return;
    }
    
    logger.debug('Admin access granted', {
      requestId: req.requestId,
      userId: req.user.id
    });
    next();
  } catch (error) {
    logger.error('Authorization error', error as Error, {
      requestId: req.requestId,
      userId: req.user?.id
    });
    ResponseUtil.authorizationError(res, 'Authorization failed');
  }
};
