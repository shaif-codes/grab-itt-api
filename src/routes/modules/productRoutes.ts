import { Router } from 'express';
import { ProductController, uploadMiddleware } from '../../controllers/product/productController.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import { validateRequest, productCreateSchema } from '../../middleware/validation.js';

const router = Router();

// Public routes
router.get('/', ProductController.getAllProducts);
router.get('/popular', ProductController.getPopularProducts);
router.get('/:id', ProductController.getProductById);

// Admin routes
router.post('/', authenticateToken, requireAdmin, uploadMiddleware, validateRequest(productCreateSchema), ProductController.createProduct);
router.put('/:id', authenticateToken, requireAdmin, uploadMiddleware, ProductController.updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, ProductController.deleteProduct);

export default router;
