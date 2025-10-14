import { Router } from 'express';
import { OrderController } from '../../controllers/order/orderController.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import { validateRequest, orderCreateSchema } from '../../middleware/validation.js';

const router = Router();

// Protected routes
router.post('/', authenticateToken, validateRequest(orderCreateSchema), OrderController.createOrder);
router.get('/my-orders', authenticateToken, OrderController.getUserOrders);
router.get('/:id', OrderController.getOrderById);

// Admin routes
router.get('/', authenticateToken, requireAdmin, OrderController.getAllOrders);
router.put('/:id/status', authenticateToken, requireAdmin, OrderController.updateOrderStatus);

export default router;
