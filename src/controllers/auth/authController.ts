import { Request, Response } from 'express';
import userHelper from '../user/userHelper.js';
import jwt from 'jsonwebtoken';
import { ResponseUtil, ERROR_CODES, logger, asyncHandler } from '../../utils/index.js';
import NotificationService from '../../services/NotificationService.js';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from '../../config/constants.js';

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";

export class AuthController {
  /**
   * Login with Firebase UID
   * This endpoint is used when the frontend has already authenticated with Firebase
   * and needs to get or create a user in our database
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, firebaseUid, password } = req.body;

    logger.info('Login attempt', {
      requestId: req.requestId,
      email,
      hasPassword: !!password,
      hasFirebaseUid: !!firebaseUid,
      ip: req.ip
    });

    if (!email || (!firebaseUid && !password)) {
      ResponseUtil.error(
        res,
        'Email and either Password or Firebase UID are required',
        'VALIDATION_ERROR',
        'REQUIRED_FIELD_MISSING',
        400
      );
      return;
    }

    try {
      let user;

      if (password) {
        // Password-based login (Admin/Dev)
        user = await userHelper.getUserByEmail(email);

        if (!user || !user.passwordHash) {
          ResponseUtil.authenticationError(res, 'Invalid credentials');
          return;
        }

        const isValidPassword = await import('bcrypt').then(m => m.default.compare(password, user.passwordHash!));

        if (!isValidPassword) {
          ResponseUtil.authenticationError(res, 'Invalid credentials');
          return;
        }
      } else {
        // Firebase UID login
        user = await userHelper.getUserByFirebaseUid(firebaseUid);

        if (!user) {
          // User doesn't exist, create them
          // This happens when a user signs in with Google for the first time
          logger.info('Creating new user from Firebase login', {
            requestId: req.requestId,
            email,
            firebaseUid
          });

          const userData = {
            firebaseUid,
            email,
            name: email.split('@')[0], // Use email prefix as name initially
            provider: 'google',
            role: 'customer' as const,
            emailVerified: true // Assuming Firebase emails are verified
          };

          user = await userHelper.createUser(userData);

          // Send welcome notification
          await NotificationService.create({
            userId: user.id,
            type: NOTIFICATION_TYPES.SYSTEM,
            title: 'Welcome to Grab-itt! 🎉',
            message: 'We are excited to have you on board. Explore our products and start shopping!',
            priority: NOTIFICATION_PRIORITY.HIGH,
            data: { event: 'welcome' }
          });
        }
      }

      // Generate JWT token for our API
      const token = jwt.sign(
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
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      logger.info('Login successful', {
        requestId: req.requestId,
        userId: user.id,
        email: user.email,
        provider: user.provider,
        method: password ? 'password' : 'firebase'
      });

      ResponseUtil.success(
        res,
        'Login successful',
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
          token
        },
        200,
        { requestId: req.requestId }
      );

    } catch (error) {
      logger.error('Login failed', error as Error, {
        requestId: req.requestId,
        email,
        ip: req.ip
      });

      ResponseUtil.authenticationError(res, 'Login failed');
    }
  });

  // Logout user
  static async logout(req: Request, res: Response) {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
  }
}
