import { Router } from 'express';
import { AuthController } from '../../controllers/auth/authController.js';

const router = Router();

// Public routes
router.post('/logout', AuthController.logout);

export default router;
