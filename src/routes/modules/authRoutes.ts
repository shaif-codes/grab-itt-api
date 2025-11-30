import { Router } from 'express';
import { AuthController } from '../../controllers/auth/authController.js';
import { validateRequest } from '../../middleware/validation.js';
import { z } from 'zod';

const router = Router();

// Validation schema for Login (Firebase or Password)
const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    firebaseUid: z.string().optional(),
    password: z.string().optional()
}).refine((data) => data.firebaseUid || data.password, {
    message: "Either Firebase UID or Password is required",
    path: ["password"], // Attach error to password field
});

// Public routes
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);

export default router;
