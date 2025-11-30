import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';
import {
    NOTIFICATION_TYPES,
    NOTIFICATION_PRIORITY,
    NOTIFICATION_CHANNELS,
    NotificationType,
    NotificationPriority,
    NotificationChannel
} from '../config/constants.js';

// Get array of enum values from constants
const notificationTypeValues = Object.values(NOTIFICATION_TYPES);
const priorityValues = Object.values(NOTIFICATION_PRIORITY);

// Notification attributes interface
export interface NotificationAttributes {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data: Record<string, any>;
    priority: NotificationPriority;
    isRead: boolean;
    readAt: Date | null;
    channels: NotificationChannel[];
    deliveryStatus: Record<string, string>;
    actionUrl: string | null;
    actionLabel: string | null;
    createdAt: Date;
    expiresAt: Date | null;
}

export interface NotificationCreationAttributes
    extends Optional<NotificationAttributes,
        'id' | 'data' | 'priority' | 'isRead' | 'readAt' | 'channels' | 'deliveryStatus' |
        'actionUrl' | 'actionLabel' | 'createdAt' | 'expiresAt'> { }

export class Notification extends Model<NotificationAttributes, NotificationCreationAttributes>
    implements NotificationAttributes {
    public declare id: string;
    public declare userId: string;
    public declare type: NotificationType;
    public declare title: string;
    public declare message: string;
    public declare data: Record<string, any>;
    public declare priority: NotificationPriority;
    public declare isRead: boolean;
    public declare readAt: Date | null;
    public declare channels: NotificationChannel[];
    public declare deliveryStatus: Record<string, string>;
    public declare actionUrl: string | null;
    public declare actionLabel: string | null;
    public declare readonly createdAt: Date;
    public declare expiresAt: Date | null;
}

Notification.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        type: {
            type: DataTypes.ENUM(...notificationTypeValues),
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        data: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        priority: {
            type: DataTypes.ENUM(...priorityValues),
            allowNull: false,
            defaultValue: NOTIFICATION_PRIORITY.MEDIUM,
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        readAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        channels: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
            defaultValue: [NOTIFICATION_CHANNELS.IN_APP],
        },
        deliveryStatus: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        actionUrl: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        actionLabel: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Notification',
        tableName: 'notifications',
        timestamps: false, // Using manual createdAt
        indexes: [
            { fields: ['userId', 'createdAt'] }, // For fetching user notifications
            { fields: ['userId', 'isRead'] },     // For unread count queries
            { fields: ['type'] },                 // For filtering by type
        ],
    }
);

export default Notification;
