import Notification from '../models/Notification.js';
import NotificationPreference from '../models/NotificationPreference.js';
import { WebSocketManager } from './WebSocketManager.js';
import {
    NOTIFICATION_TYPES,
    NOTIFICATION_PRIORITY,
    NOTIFICATION_CHANNELS,
    WS_EVENTS,
    NotificationType,
    NotificationPriority,
    NotificationChannel
} from '../config/constants.js';

export interface CreateNotificationDTO {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    priority?: NotificationPriority;
    actionUrl?: string;
    actionLabel?: string;
    channels?: NotificationChannel[];
}

class NotificationService {
    private wsManager: WebSocketManager;

    constructor() {
        this.wsManager = WebSocketManager.getInstance();
    }

    // Create and deliver notification using hybrid approach
    async create(dto: CreateNotificationDTO) {
        // Check user preferences before creating
        const preferences = await this.getUserPreferences(dto.userId);

        if (!this.shouldSend(dto.type, preferences)) {
            console.log(`⊘ User ${dto.userId} disabled ${dto.type} notifications`);
            return null;
        }

        // Create notification in database
        const notification = await Notification.create({
            userId: dto.userId,
            type: dto.type,
            title: dto.title,
            message: dto.message,
            data: dto.data || {},
            priority: dto.priority || NOTIFICATION_PRIORITY.MEDIUM,
            actionUrl: dto.actionUrl,
            actionLabel: dto.actionLabel,
            channels: dto.channels || [NOTIFICATION_CHANNELS.IN_APP],
            isRead: false,
            deliveryStatus: {},
        });

        // Deliver through selected channels
        await this.deliver(notification, dto.channels || [NOTIFICATION_CHANNELS.IN_APP]);

        return notification;
    }

    // Deliver notification via multiple channels
    private async deliver(notification: any, channels: NotificationChannel[]) {
        const results: any[] = [];

        // In-app notification via WebSocket (real-time)
        if (channels.includes(NOTIFICATION_CHANNELS.IN_APP)) {
            const sent = this.sendInApp(notification);
            results.push({
                channel: NOTIFICATION_CHANNELS.IN_APP,
                status: sent ? 'sent' : 'failed'
            });
        }

        // Email notification (async - can be queued)
        if (channels.includes(NOTIFICATION_CHANNELS.EMAIL)) {
            // TODO: Integrate email service (SendGrid, AWS SES)
            results.push({
                channel: NOTIFICATION_CHANNELS.EMAIL,
                status: 'pending'
            });
        }

        // Push notification (Phase 2 - Firebase)
        if (channels.includes(NOTIFICATION_CHANNELS.PUSH)) {
            // TODO: Integrate Firebase Cloud Messaging
            results.push({
                channel: NOTIFICATION_CHANNELS.PUSH,
                status: 'pending'
            });
        }

        // Update delivery status in database
        const status = results.reduce((acc, r) => {
            acc[r.channel.toLowerCase()] = r.status;
            return acc;
        }, {} as Record<string, string>);

        await notification.update({ deliveryStatus: status });
    }

    // Send via WebSocket for real-time delivery
    private sendInApp(notification: any): boolean {
        return this.wsManager.sendToUser(notification.userId, {
            type: WS_EVENTS.NOTIFICATION,
            payload: notification,
        });
    }

    // Mark single notification as read
    async markAsRead(notificationId: string, userId: string): Promise<boolean> {
        const notification = await Notification.findOne({
            where: { id: notificationId, userId },
        });

        if (!notification) return false;

        await notification.update({ isRead: true, readAt: new Date() });

        // Notify client to update UI
        this.wsManager.sendToUser(userId, {
            type: WS_EVENTS.NOTIFICATION_READ,
            payload: { notificationId },
        });

        return true;
    }

    // Mark all notifications as read for user
    async markAllAsRead(userId: string): Promise<number> {
        const [count] = await Notification.update(
            { isRead: true, readAt: new Date() },
            { where: { userId, isRead: false } }
        );

        // Notify client
        this.wsManager.sendToUser(userId, {
            type: WS_EVENTS.ALL_NOTIFICATIONS_READ,
        });

        return count;
    }

    // Get user notifications with pagination
    async getUserNotifications(userId: string, options: {
        limit?: number;
        offset?: number;
        unreadOnly?: boolean;
    } = {}) {
        const { limit = 20, offset = 0, unreadOnly = false } = options;

        const where: any = { userId };
        if (unreadOnly) where.isRead = false;

        const { rows: notifications, count: total } = await Notification.findAndCountAll({
            where,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });

        // Get unread count
        const unreadCount = await Notification.count({
            where: { userId, isRead: false },
        });

        return {
            notifications,
            pagination: {
                total,
                unreadCount,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        };
    }

    // Get or create user notification preferences
    private async getUserPreferences(userId: string): Promise<NotificationPreference> {
        const [prefs] = await NotificationPreference.findOrCreate({
            where: { userId },
            defaults: { userId },
        });

        return prefs;
    }

    // Update user notification preferences
    async updatePreferences(userId: string, preferences: Record<string, any>) {
        const [prefs] = await NotificationPreference.findOrCreate({
            where: { userId },
            defaults: { userId },
        });

        await prefs.update({ preferences, updatedAt: new Date() });
        return prefs;
    }

    // Check if notification should be sent based on user preferences
    private shouldSend(type: NotificationType, preferences: NotificationPreference): boolean {
        // Always send critical notifications (ORDER, PAYMENT)
        if (type === NOTIFICATION_TYPES.ORDER || type === NOTIFICATION_TYPES.PAYMENT) {
            return true;
        }

        const typePrefs = preferences.preferences[type];
        return typePrefs?.inApp !== false;
    }

    // Cleanup old read notifications (for cron job)
    async cleanupOld(daysOld: number = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const deleted = await Notification.destroy({
            where: {
                createdAt: { $lt: cutoffDate } as any,
                isRead: true,
            },
        });

        console.log(`🗑️  Cleaned ${deleted} old notifications`);
        return deleted;
    }

    // Get notification statistics for user
    async getStats(userId: string) {
        const total = await Notification.count({ where: { userId } });
        const unread = await Notification.count({ where: { userId, isRead: false } });
        const byType = await Notification.count({
            where: { userId },
            group: ['type'],
        });

        return { total, unread, byType };
    }
}

export default new NotificationService();
