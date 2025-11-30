import { Router } from 'express';
import { AdminController } from '../../controllers/admin/adminController.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';

const router = Router();

// Admin routes
router.use(authenticateToken, requireAdmin);

router.get('/sync-database', AdminController.syncDatabase);
router.get('/orders', AdminController.getOrders);
router.patch('/orders/:id/status', AdminController.updateOrderStatus);
router.get('/stats', AdminController.getStats);
router.get('/users', AdminController.getUsers);
router.get('/offers', AdminController.getOffers);
router.post('/offers', AdminController.createOffer);
router.put('/offers/:id', AdminController.updateOffer);
router.delete('/offers/:id', AdminController.deleteOffer);

export default router;
