import { Router } from 'express';
import { UserController } from '../../controllers/user/userController.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import { validateRequest, userRegistrationSchema, userLoginSchema } from '../../middleware/validation.js';

const router = Router();

// Public routes
router.post('/register', validateRequest(userRegistrationSchema), UserController.register);
router.post('/login', validateRequest(userLoginSchema), UserController.login);

// Protected routes
router.get('/profile', authenticateToken, UserController.getProfile);
router.put('/profile', authenticateToken, UserController.updateProfile);

// Admin routes
router.get('/all', authenticateToken, requireAdmin, UserController.getAllUsers);

export default router;
