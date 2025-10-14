import { Request, Response } from 'express';
import userHelper from './userHelper.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { ResponseUtil, ERROR_CODES, logger, asyncHandler } from '../../utils/index.js';

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";

export class UserController {
  // Register a new user
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, phone, addresses } = req.body;

    logger.info('User registration attempt', {
      requestId: req.requestId,
      email,
      ip: req.ip
    });

    // Check if user already exists
    const existingUser = await userHelper.getUserByEmail(email);
    if (existingUser) {
      logger.warn('User registration failed: Email already exists', {
        requestId: req.requestId,
        email,
        ip: req.ip
      });
      ResponseUtil.conflict(res, 'User with this email already exists', ERROR_CODES.USER_ALREADY_EXISTS);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userData = {
      name,
      email,
      passwordHash,
      phone: phone || null,
      addresses: addresses || [],
      role: 'customer' as const
    };

    const user = await userHelper.createUser(userData);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info('User registered successfully', {
      requestId: req.requestId,
      userId: user.id,
      email: user.email
    });

    ResponseUtil.success(
      res,
      'User registered successfully',
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          addresses: user.addresses,
          role: user.role
        },
        token
      },
      201,
      { requestId: req.requestId }
    );
  })

  // Login user
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    logger.info('User login attempt', {
      requestId: req.requestId,
      email,
      ip: req.ip
    });

    // Find user by email
    const user = await userHelper.getUserByEmail(email);
    if (!user) {
      logger.warn('Login failed: User not found', {
        requestId: req.requestId,
        email,
        ip: req.ip
      });
      ResponseUtil.authenticationError(res, 'Invalid email or password', ERROR_CODES.INVALID_CREDENTIALS);
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      logger.warn('Login failed: Invalid password', {
        requestId: req.requestId,
        email,
        ip: req.ip
      });
      ResponseUtil.authenticationError(res, 'Invalid email or password', ERROR_CODES.INVALID_CREDENTIALS);
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
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

    logger.info('User logged in successfully', {
      requestId: req.requestId,
      userId: user.id,
      email: user.email
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
          role: user.role
        },
        token
      },
      200,
      { requestId: req.requestId }
    );
  })

  // Get user profile
  static getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      ResponseUtil.authenticationError(res, 'User not authenticated');
      return;
    }

    const user = await userHelper.getUser(userId);
    if (!user) {
      ResponseUtil.notFound(res, 'User not found', 'USER_NOT_FOUND');
      return;
    }

    logger.debug('User profile retrieved', {
      requestId: req.requestId,
      userId: user.id
    });

    ResponseUtil.success(
      res,
      'Profile retrieved successfully',
      {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses,
        role: user.role
      },
      200,
      { requestId: req.requestId }
    );
  })

  // Update user profile
  static updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      ResponseUtil.authenticationError(res, 'User not authenticated');
      return;
    }

    const { name, phone, addresses } = req.body;
    const updates: any = {};
    
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (addresses) updates.addresses = addresses;

    const updatedUser = await userHelper.updateUser(userId, updates);
    if (!updatedUser) {
      ResponseUtil.notFound(res, 'User not found', 'USER_NOT_FOUND');
      return;
    }

    logger.info('User profile updated', {
      requestId: req.requestId,
      userId: updatedUser.id
    });

    ResponseUtil.success(
      res,
      'Profile updated successfully',
      {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        addresses: updatedUser.addresses,
        role: updatedUser.role
      },
      200,
      { requestId: req.requestId }
    );
  })

  // Get all users (Admin only)
  static getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement getAllUsers in userHelper
    logger.info('Get all users requested', {
      requestId: req.requestId,
      userId: (req as any).user?.id
    });

    ResponseUtil.success(
      res,
      'Users retrieved successfully',
      [],
      200,
      { requestId: req.requestId }
    );
  })
}
