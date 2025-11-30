import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { WS_EVENTS } from '../config/constants.js';

export class WebSocketManager {
    private static instance: WebSocketManager;
    private wss: WebSocketServer | null = null;
    private clients: Map<string, WebSocket> = new Map(); // userId -> WebSocket

    private constructor() { }

    static getInstance(): WebSocketManager {
        if (!WebSocketManager.instance) {
            WebSocketManager.instance = new WebSocketManager();
        }
        return WebSocketManager.instance;
    }

    // Initialize WebSocket server on HTTP server
    initialize(server: Server) {
        this.wss = new WebSocketServer({ server, path: '/ws' });

        this.wss.on(WS_EVENTS.CONNECTION, (ws: WebSocket, req) => {
            console.log('📡 New WebSocket connection attempt');

            // Authenticate user from query params
            const userId = this.authenticateConnection(req);

            if (!userId) {
                ws.close(1008, 'Unauthorized');
                return;
            }

            // Store connection
            this.clients.set(userId, ws);
            console.log(`✓ User ${userId} connected. Total clients: ${this.clients.size}`);

            // Handle incoming messages
            ws.on(WS_EVENTS.MESSAGE, (message: string) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.handleMessage(userId, data);
                } catch (error) {
                    console.error('Invalid message format:', error);
                }
            });

            // Handle disconnection
            ws.on(WS_EVENTS.CLOSE, () => {
                this.clients.delete(userId);
                console.log(`✗ User ${userId} disconnected. Total clients: ${this.clients.size}`);
            });

            // Handle errors
            ws.on(WS_EVENTS.ERROR, (error) => {
                console.error(`WebSocket error for user ${userId}:`, error);
            });

            // Send welcome message
            this.sendToUser(userId, {
                type: WS_EVENTS.CONNECTED,
                payload: { message: 'Connected to Grab-itt notifications' },
            });
        });

        console.log('🚀 WebSocket server initialized on /ws');
    }

    // Extract and verify JWT from query params
    private authenticateConnection(req: any): string | null {
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const token = url.searchParams.get('token');

            if (!token) return null;

            // Verify JWT and extract userId
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                console.error('JWT_SECRET not configured');
                return null;
            }

            const decoded = jwt.verify(token, jwtSecret) as { id: string; userId?: string };
            // JWT payload uses 'id' field, not 'userId'
            return decoded.id || decoded.userId || null;
        } catch (error) {
            console.error('WebSocket auth failed:', error);
            return null;
        }
    }

    // Handle client messages
    private handleMessage(userId: string, data: any) {
        switch (data.type) {
            case WS_EVENTS.PING:
                this.sendToUser(userId, { type: WS_EVENTS.PONG });
                break;

            default:
                console.log('Unknown message type:', data.type);
        }
    }

    // Send message to specific user
    sendToUser(userId: string, message: any): boolean {
        const client = this.clients.get(userId);

        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
            return true;
        }

        return false;
    }

    // Broadcast to all connected users
    broadcast(message: any) {
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }

    // Send to multiple users
    sendToUsers(userIds: string[], message: any) {
        userIds.forEach(userId => this.sendToUser(userId, message));
    }

    // Check if user is online
    isUserOnline(userId: string): boolean {
        return this.clients.has(userId);
    }

    // Get connected user count
    getConnectedCount(): number {
        return this.clients.size;
    }
}

export default WebSocketManager;
