import { Request, Response } from 'express';
import { FirebaseService } from '../../services/firebase.js';
import userHelper from '../user/userHelper.js';
import { ResponseUtil, ERROR_CODES, logger, asyncHandler } from '../../utils/index.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";

export class GoogleAuthController {
  /**
   * Verify Google ID token and create/update user
   */
  static verifyGoogleToken = asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body;

    if (!idToken) {
      ResponseUtil.error(
        res,
        'Google ID token is required',
        'VALIDATION_ERROR',
        'REQUIRED_FIELD_MISSING',
        400,
        undefined,
        'idToken'
      );
      return;
    }

    logger.info('Google Sign-In attempt', {
      requestId: req.requestId,
      ip: req.ip
    });

    try {
      // Verify the Google ID token with Firebase
      const decodedToken = await FirebaseService.verifyIdToken(idToken);
      
      // Extract user information from the decoded token
      const {
        uid: firebaseUid,
        email,
        name,
        picture: profilePictureUrl,
        email_verified: emailVerified,
        firebase: { identities }
      } = decodedToken;

      // Get Google ID from identities
      const googleId = identities?.google?.[0] || firebaseUid;

      if (!email) {
        ResponseUtil.error(
          res,
          'Email not found in Google token',
          'AUTHENTICATION_ERROR',
          'INVALID_CREDENTIALS',
          400
        );
        return;
      }

      // Create or update user in our database
      const userData = {
        firebaseUid,
        email,
        name: name || email.split('@')[0],
        profilePictureUrl,
        emailVerified: emailVerified || false,
        googleId
      };

      const user = await userHelper.createOrUpdateFirebaseUser(userData);

      // Generate JWT token for our API
      const apiToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          provider: user.provider
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set HTTP-only cookie
      res.cookie('token', apiToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      logger.info('Google Sign-In successful', {
        requestId: req.requestId,
        userId: user.id,
        email: user.email,
        provider: user.provider
      });

      ResponseUtil.success(
        res,
        'Google Sign-In successful',
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            addresses: user.addresses,
            role: user.role,
            provider: user.provider,
            profilePictureUrl: user.profilePictureUrl,
            emailVerified: user.emailVerified
          },
          token: apiToken
        },
        200,
        { requestId: req.requestId }
      );

    } catch (error) {
      logger.error('Google Sign-In failed', error as Error, {
        requestId: req.requestId,
        ip: req.ip
      });

      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          ResponseUtil.authenticationError(res, 'Google token expired', ERROR_CODES.TOKEN_EXPIRED);
          return;
        }
        if (error.message.includes('invalid')) {
          ResponseUtil.authenticationError(res, 'Invalid Google token', ERROR_CODES.TOKEN_INVALID);
          return;
        }
      }

      ResponseUtil.authenticationError(res, 'Google Sign-In failed');
    }
  });

  /**
   * Get available authentication providers
   */
  static getAuthProviders = asyncHandler(async (req: Request, res: Response) => {
    logger.debug('Auth providers requested', {
      requestId: req.requestId
    });

    ResponseUtil.success(
      res,
      'Authentication providers retrieved',
      {
        providers: [
          {
            id: 'email',
            name: 'Email & Password',
            enabled: true,
            description: 'Sign in with email and password'
          },
          {
            id: 'google',
            name: 'Google',
            enabled: true,
            description: 'Sign in with Google account',
            clientId: process.env.FIREBASE_CLIENT_ID
          }
        ]
      },
      200,
      { requestId: req.requestId }
    );
  });

  /**
   * Link Google account to existing user
   */
  static linkGoogleAccount = asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      ResponseUtil.authenticationError(res, 'User authentication required');
      return;
    }

    if (!idToken) {
      ResponseUtil.error(
        res,
        'Google ID token is required',
        'VALIDATION_ERROR',
        'REQUIRED_FIELD_MISSING',
        400,
        undefined,
        'idToken'
      );
      return;
    }

    try {
      // Verify the Google ID token
      const decodedToken = await FirebaseService.verifyIdToken(idToken);
      const { uid: firebaseUid, email, firebase: { identities } } = decodedToken;
      const googleId = identities?.google?.[0] || firebaseUid;

      // Check if Google account is already linked to another user
      const existingGoogleUser = await userHelper.getUserByGoogleId(googleId);
      if (existingGoogleUser && existingGoogleUser.id !== userId) {
        ResponseUtil.conflict(res, 'Google account is already linked to another user');
        return;
      }

      // Link the Google account
      const updatedUser = await userHelper.linkFirebaseAccount(userId, firebaseUid, googleId);

      logger.info('Google account linked successfully', {
        requestId: req.requestId,
        userId,
        googleId
      });

      ResponseUtil.success(
        res,
        'Google account linked successfully',
        {
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            provider: updatedUser.provider,
            profilePictureUrl: updatedUser.profilePictureUrl,
            emailVerified: updatedUser.emailVerified
          }
        },
        200,
        { requestId: req.requestId }
      );

    } catch (error) {
      logger.error('Google account linking failed', error as Error, {
        requestId: req.requestId,
        userId
      });

      ResponseUtil.authenticationError(res, 'Failed to link Google account');
    }
  });
}
