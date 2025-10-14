import { Router } from 'express';
import { GoogleAuthController } from '../../controllers/auth/googleAuthController.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validation.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const googleTokenSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required')
});

// Google Sign-In routes
router.post('/verify', 
  validateRequest(googleTokenSchema),
  GoogleAuthController.verifyGoogleToken
);

router.get('/providers', 
  GoogleAuthController.getAuthProviders
);

router.post('/link',
  authenticateToken,
  validateRequest(googleTokenSchema),
  GoogleAuthController.linkGoogleAccount
);

export default router;
