// WebSocket event names - centralized for maintainability
export const WS_EVENTS = {
    // Connection lifecycle
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    CLOSE: 'close',
    ERROR: 'error',
    MESSAGE: 'message',

    // Client → Server events
    PING: 'PING',
    MARK_READ: 'MARK_READ',
    SUBSCRIBE: 'SUBSCRIBE',
    UNSUBSCRIBE: 'UNSUBSCRIBE',

    // Server → Client events
    CONNECTED: 'CONNECTED',
    PONG: 'PONG',
    NOTIFICATION: 'NOTIFICATION',
    NOTIFICATION_READ: 'NOTIFICATION_READ',
    ALL_NOTIFICATIONS_READ: 'ALL_NOTIFICATIONS_READ',
    BATCH_NOTIFICATIONS: 'BATCH_NOTIFICATIONS',
} as const;

// Notification types for e-commerce
export const NOTIFICATION_TYPES = {
    ORDER: 'ORDER',
    PAYMENT: 'PAYMENT',
    SHIPPING: 'SHIPPING',
    DELIVERY: 'DELIVERY',
    MARKETING: 'MARKETING',
    SYSTEM: 'SYSTEM',
    SOCIAL: 'SOCIAL',
} as const;

// Priority levels
export const NOTIFICATION_PRIORITY = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
} as const;

// Delivery channels
export const NOTIFICATION_CHANNELS = {
    IN_APP: 'IN_APP',
    EMAIL: 'EMAIL',
    PUSH: 'PUSH',
    SMS: 'SMS',
} as const;

// Type helpers for TypeScript
export type NotificationType = keyof typeof NOTIFICATION_TYPES;
export type NotificationPriority = keyof typeof NOTIFICATION_PRIORITY;
export type NotificationChannel = keyof typeof NOTIFICATION_CHANNELS;

export const CONSTANTS = {
    firebaseConfig: {
        // Client-side configuration
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID
    },

    // Server-side configuration
    firebaseAdmin: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        clientId: process.env.FIREBASE_CLIENT_ID,
        authUri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
        tokenUri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
        authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
        clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL
    }
};