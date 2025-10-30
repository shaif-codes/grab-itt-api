import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { PaymentController } from '../../controllers/payment/paymentController.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';

const router = Router();

// Rate limiting for payment operations to prevent abuse
const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 payment requests per windowMs
  message: 'Too many payment requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const callbackRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Limit callbacks to 50 per windowMs
  message: 'Too many callback requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.get('/config', PaymentController.getPaymentConfig);
router.post('/callback', callbackRateLimiter, PaymentController.handlePaymentCallback);
router.get('/status/:orderId', PaymentController.checkPaymentStatus);

// Protected routes - require authentication with rate limiting
router.post('/initiate/upi', authenticateToken, paymentRateLimiter, PaymentController.initiateUpiPayment);
router.post('/initiate/card', authenticateToken, paymentRateLimiter, PaymentController.initiateCardPayment);

// Admin routes - require admin privileges with rate limiting
router.post('/refund', authenticateToken, requireAdmin, paymentRateLimiter, PaymentController.initiateRefund);

export default router;
