import { Router } from 'express';
import { PaymentController } from '../../controllers/payment/paymentController.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';

const router = Router();

// Public routes
router.get('/config', PaymentController.getPaymentConfig);
router.post('/callback', PaymentController.handlePaymentCallback);
router.get('/status/:orderId', PaymentController.checkPaymentStatus);

// Protected routes - require authentication
router.post('/initiate/upi', authenticateToken, PaymentController.initiateUpiPayment);
router.post('/initiate/card', authenticateToken, PaymentController.initiateCardPayment);

// Admin routes - require admin privileges
router.post('/refund', authenticateToken, requireAdmin, PaymentController.initiateRefund);

export default router;
