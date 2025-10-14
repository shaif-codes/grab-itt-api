import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ResponseUtil, logger } from '../utils/index.js';

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      logger.debug('Request validation passed', {
        requestId: req.requestId,
        method: req.method,
        url: req.url
      });
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        logger.warn('Request validation failed', {
          requestId: req.requestId,
          method: req.method,
          url: req.url,
          validationErrors: error.errors
        });
        
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        ResponseUtil.validationError(res, 'Validation failed', validationErrors);
        return;
      }
      
      logger.error('Validation error', error, {
        requestId: req.requestId,
        method: req.method,
        url: req.url
      });
      
      ResponseUtil.error(
        res,
        'Invalid request data',
        'VALIDATION_ERROR',
        'INVALID_REQUEST_DATA',
        400
      );
    }
  };
};

// Common validation schemas
export const userRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  addresses: z.array(z.object({
    type: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    isDefault: z.boolean().optional()
  })).optional()
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const productCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.enum(['Groceries', 'Medicine', 'Vegetables', 'Food']),
  originalPrice: z.string().min(1, 'Original price is required'),
  price: z.string().min(1, 'Price is required'),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  isAvailable: z.boolean().optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  isPopular: z.boolean().optional()
});

export const orderCreateSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    price: z.string()
  })).min(1, 'At least one item is required'),
  address: z.object({
    type: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    pincode: z.string()
  }),
  paymentMethod: z.enum(['COD', 'UPI']),
  upiReferenceId: z.string().optional()
});
