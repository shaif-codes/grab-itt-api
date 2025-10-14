import { Request, Response, NextFunction } from 'express';
import { FirebaseService } from '../services/firebase.js';
import { ResponseUtil, ERROR_CODES, logger } from '../utils/index.js';

export interface FirebaseAuthenticatedRequest extends Request {
  firebaseUser?: {
    uid: string;
    email: string;
    emailVerified: boolean;
    displayName?: string;
    photoURL?: string;
    providerData: any[];
  };
}

/**
 * Middleware to authenticate Firebase ID tokens
 */
export const authenticateFirebaseToken = async (
  req: FirebaseAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.warn('Firebase authentication failed: No token provided', {
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      ResponseUtil.authenticationError(res, 'Firebase ID token required', ERROR_CODES.TOKEN_INVALID);
      return;
    }

    // Verify the Firebase ID token
    const decodedToken = await FirebaseService.verifyIdToken(token);
    
    // Get additional user data from Firebase
    const userRecord = await FirebaseService.getUserByUid(decodedToken.uid);
    
    if (!userRecord) {
      logger.warn('Firebase authentication failed: User not found', {
        requestId: req.requestId,
        uid: decodedToken.uid,
        ip: req.ip
      });
      ResponseUtil.authenticationError(res, 'User not found in Firebase', ERROR_CODES.USER_NOT_FOUND);
      return;
    }

    // Attach Firebase user data to request
    req.firebaseUser = {
      uid: userRecord.uid,
      email: userRecord.email || '',
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      providerData: userRecord.providerData
    };

    logger.debug('Firebase user authenticated successfully', {
      requestId: req.requestId,
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified
    });

    next();
  } catch (error) {
    logger.error('Firebase authentication error', error as Error, {
      requestId: req.requestId,
      ip: req.ip
    });
    
    // Handle specific Firebase errors
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        ResponseUtil.authenticationError(res, 'Firebase token expired', ERROR_CODES.TOKEN_EXPIRED);
        return;
      }
      if (error.message.includes('invalid')) {
        ResponseUtil.authenticationError(res, 'Invalid Firebase token', ERROR_CODES.TOKEN_INVALID);
        return;
      }
    }
    
    ResponseUtil.authenticationError(res, 'Firebase authentication failed');
  }
};

/**
 * Middleware to optionally authenticate Firebase tokens (for endpoints that work with both auth types)
 */
export const optionalFirebaseAuth = async (
  req: FirebaseAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without Firebase auth
      next();
      return;
    }

    // Try to verify the token
    const decodedToken = await FirebaseService.verifyIdToken(token);
    const userRecord = await FirebaseService.getUserByUid(decodedToken.uid);
    
    if (userRecord) {
      req.firebaseUser = {
        uid: userRecord.uid,
        email: userRecord.email || '',
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        providerData: userRecord.providerData
      };
    }

    next();
  } catch (error) {
    // If Firebase auth fails, continue without it
    logger.debug('Optional Firebase auth failed, continuing without', {
      requestId: req.requestId,
      error: (error as Error).message
    });
    next();
  }
};

/**
 * Middleware to check if user is authenticated via Firebase
 */
export const requireFirebaseAuth = (req: FirebaseAuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.firebaseUser) {
    logger.warn('Firebase authentication required but not provided', {
      requestId: req.requestId,
      ip: req.ip
    });
    ResponseUtil.authenticationError(res, 'Firebase authentication required', ERROR_CODES.TOKEN_INVALID);
    return;
  }
  next();
};
