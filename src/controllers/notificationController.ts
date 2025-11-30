import { Request, Response } from 'express';
import NotificationService from '../services/NotificationService.js';

export class NotificationController {
    // GET /api/v1/notifications - Get user notifications with pagination
    async getNotifications(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id; // From auth middleware
            const { limit, offset, unreadOnly } = req.query;

            const result = await NotificationService.getUserNotifications(userId, {
                limit: limit ? parseInt(limit as string) : 20,
                offset: offset ? parseInt(offset as string) : 0,
                unreadOnly: unreadOnly === 'true',
            });

            res.json({ success: true, data: result });
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch notifications'
            });
        }
    }

    // PATCH /api/v1/notifications/:id/read - Mark notification as read
    async markAsRead(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            const updated = await NotificationService.markAsRead(id, userId);

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            res.json({
                success: true,
                message: 'Notification marked as read'
            });
        } catch (error) {
            console.error('Failed to mark as read:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark as read'
            });
        }
    }

    // POST /api/v1/notifications/mark-all-read - Mark all as read
    async markAllAsRead(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            const count = await NotificationService.markAllAsRead(userId);

            res.json({
                success: true,
                message: 'All notifications marked as read',
                count
            });
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark all as read'
            });
        }
    }

    // GET /api/v1/notifications/preferences - Get user preferences
    async getPreferences(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            // This will internally call getUserPreferences which creates if not exists
            const result = await NotificationService.getUserNotifications(userId, { limit: 1 });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Failed to get preferences:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get preferences'
            });
        }
    }

    // PUT /api/v1/notifications/preferences - Update preferences
    async updatePreferences(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { preferences } = req.body;

            if (!preferences) {
                return res.status(400).json({
                    success: false,
                    message: 'Preferences are required'
                });
            }

            const updated = await NotificationService.updatePreferences(userId, preferences);

            res.json({
                success: true,
                message: 'Preferences updated',
                data: updated
            });
        } catch (error) {
            console.error('Failed to update preferences:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update preferences'
            });
        }
    }

    // GET /api/v1/notifications/stats - Get notification statistics
    async getStats(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            const stats = await NotificationService.getStats(userId);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Failed to get stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get stats'
            });
        }
    }
}

export default new NotificationController();
