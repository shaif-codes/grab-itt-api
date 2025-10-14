import { Router } from 'express';
import { AdminController } from '../../controllers/admin/adminController.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';

const router = Router();

// Admin routes
router.get('/sync-database', AdminController.syncDatabase);

export default router;
