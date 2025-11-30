import express from 'express';
import notificationController from '../controllers/notificationController.js';

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user notifications
router.get('/', notificationController.getNotifications);

// Mark notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.post('/mark-all-read', notificationController.markAllAsRead);

// Get notification preferences
router.get('/preferences', notificationController.getPreferences);

// Update notification preferences
router.put('/preferences', notificationController.updatePreferences);

// Get notification statistics
router.get('/stats', notificationController.getStats);

export default router;
