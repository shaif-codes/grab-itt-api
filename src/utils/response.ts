import { Response } from 'express';

// Standard HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// Error types for better categorization
export const ERROR_TYPES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
} as const;

// Error codes for specific error scenarios
export const ERROR_CODES = {
  // Authentication & Authorization
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  ACCESS_DENIED: 'ACCESS_DENIED',
  ADMIN_REQUIRED: 'ADMIN_REQUIRED',
  
  // Validation
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT: 'INVALID_FORMAT',
  VALUE_TOO_SHORT: 'VALUE_TOO_SHORT',
  VALUE_TOO_LONG: 'VALUE_TOO_LONG',
  INVALID_EMAIL: 'INVALID_EMAIL',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  
  // Business Logic
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  
  // System
  DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED'
} as const;

// Success response interface
export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Error response interface
export interface ErrorResponse {
  success: false;
  message: string;
  error: {
    type: string;
    code: string;
    details?: any;
    field?: string;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    stack?: string;
  };
}

// Response utility class
export class ResponseUtil {
  /**
   * Send a successful response
   */
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = HTTP_STATUS.OK,
    meta?: Partial<SuccessResponse<T>['meta']>
  ): void {
    const response: SuccessResponse<T> = {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    };

    res.status(statusCode).json(response);
  }

  /**
   * Send an error response
   */
  static error(
    res: Response,
    message: string,
    errorType: string,
    errorCode: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details?: any,
    field?: string
  ): void {
    const response: ErrorResponse = {
      success: false,
      message,
      error: {
        type: errorType,
        code: errorCode,
        details,
        field
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      response.meta!.stack = new Error().stack;
    }

    res.status(statusCode).json(response);
  }

  /**
   * Send validation error response
   */
  static validationError(
    res: Response,
    message: string,
    errors: Array<{ field: string; message: string; code: string }>
  ): void {
    const response: ErrorResponse = {
      success: false,
      message,
      error: {
        type: ERROR_TYPES.VALIDATION_ERROR,
        code: ERROR_CODES.REQUIRED_FIELD_MISSING,
        details: { validationErrors: errors }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(response);
  }

  /**
   * Send authentication error response
   */
  static authenticationError(
    res: Response,
    message: string = 'Authentication required',
    code: string = ERROR_CODES.TOKEN_INVALID
  ): void {
    ResponseUtil.error(
      res,
      message,
      ERROR_TYPES.AUTHENTICATION_ERROR,
      code,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  /**
   * Send authorization error response
   */
  static authorizationError(
    res: Response,
    message: string = 'Access denied',
    code: string = ERROR_CODES.ACCESS_DENIED
  ): void {
    ResponseUtil.error(
      res,
      message,
      ERROR_TYPES.AUTHORIZATION_ERROR,
      code,
      HTTP_STATUS.FORBIDDEN
    );
  }

  /**
   * Send not found error response
   */
  static notFound(
    res: Response,
    message: string = 'Resource not found',
    code: string = ERROR_CODES.PRODUCT_NOT_FOUND
  ): void {
    ResponseUtil.error(
      res,
      message,
      ERROR_TYPES.NOT_FOUND_ERROR,
      code,
      HTTP_STATUS.NOT_FOUND
    );
  }

  /**
   * Send conflict error response
   */
  static conflict(
    res: Response,
    message: string,
    code: string = ERROR_CODES.USER_ALREADY_EXISTS
  ): void {
    ResponseUtil.error(
      res,
      message,
      ERROR_TYPES.CONFLICT_ERROR,
      code,
      HTTP_STATUS.CONFLICT
    );
  }

  /**
   * Send internal server error response
   */
  static internalError(
    res: Response,
    message: string = 'Internal server error',
    code: string = ERROR_CODES.DATABASE_CONNECTION_FAILED,
    details?: any
  ): void {
    ResponseUtil.error(
      res,
      message,
      ERROR_TYPES.INTERNAL_ERROR,
      code,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      details
    );
  }

  /**
   * Send paginated response
   */
  static paginated<T>(
    res: Response,
    message: string,
    data: T[],
    page: number,
    limit: number,
    total: number,
    statusCode: number = HTTP_STATUS.OK
  ): void {
    const totalPages = Math.ceil(total / limit);
    
    ResponseUtil.success(
      res,
      message,
      data,
      statusCode,
      {
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    );
  }
}
