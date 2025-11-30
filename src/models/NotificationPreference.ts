import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';
import { NOTIFICATION_TYPES, NOTIFICATION_CHANNELS } from '../config/constants.js';

// Default preferences for new users
const DEFAULT_PREFERENCES = {
    [NOTIFICATION_TYPES.ORDER]: {
        inApp: true,
        email: true,
        push: true
    },
    [NOTIFICATION_TYPES.PAYMENT]: {
        inApp: true,
        email: true,
        push: true
    },
    [NOTIFICATION_TYPES.SHIPPING]: {
        inApp: true,
        email: true,
        push: true
    },
    [NOTIFICATION_TYPES.DELIVERY]: {
        inApp: true,
        email: true,
        push: false
    },
    [NOTIFICATION_TYPES.MARKETING]: {
        inApp: true,
        email: false,
        push: false
    },
    [NOTIFICATION_TYPES.SYSTEM]: {
        inApp: true,
        email: false,
        push: false
    },
};

export interface NotificationPreferenceAttributes {
    id: string;
    userId: string;
    preferences: Record<string, any>; // Type-specific channel preferences
    doNotDisturb: {
        enabled: boolean;
        startTime?: string;
        endTime?: string;
    };
    updatedAt: Date;
}

export interface NotificationPreferenceCreationAttributes
    extends Optional<NotificationPreferenceAttributes, 'id' | 'preferences' | 'doNotDisturb' | 'updatedAt'> { }

export class NotificationPreference
    extends Model<NotificationPreferenceAttributes, NotificationPreferenceCreationAttributes>
    implements NotificationPreferenceAttributes {
    public declare id: string;
    public declare userId: string;
    public declare preferences: Record<string, any>;
    public declare doNotDisturb: { enabled: boolean; startTime?: string; endTime?: string };
    public declare readonly updatedAt: Date;
}

NotificationPreference.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        preferences: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: DEFAULT_PREFERENCES,
        },
        doNotDisturb: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: { enabled: false },
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: 'NotificationPreference',
        tableName: 'notification_preferences',
        timestamps: false,
    }
);

export default NotificationPreference;
