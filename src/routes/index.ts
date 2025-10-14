import { Express } from 'express';
import express from 'express';
import path from 'path';
import { FirebaseService } from '../services/firebase.js';
import { ResponseUtil } from '../utils/index.js';

// Import route modules
import userRoutes from './modules/userRoutes.js';
import productRoutes from './modules/productRoutes.js';
import orderRoutes from './modules/orderRoutes.js';
import authRoutes from './modules/authRoutes.js';
import adminRoutes from './modules/adminRoutes.js';
import googleAuthRoutes from './modules/googleAuthRoutes.js';

export const registerRoutes = (app: Express) => {
  // Health check route
  app.get('/health', (req, res) => {
    res.json({ 
      success: true, 
      message: 'Backend server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Firebase health check route
  app.get('/health/firebase', async (req, res) => {
    try {
      const isHealthy = await FirebaseService.healthCheck();
      if (isHealthy) {
        ResponseUtil.success(res, 'Firebase is healthy', {
          status: 'connected',
          timestamp: new Date().toISOString()
        });
      } else {
        ResponseUtil.error(res, 'Firebase health check failed', 'EXTERNAL_SERVICE_ERROR', 'FIREBASE_CONNECTION_FAILED', 503);
      }
    } catch (error) {
      ResponseUtil.error(res, 'Firebase health check error', 'EXTERNAL_SERVICE_ERROR', 'FIREBASE_CONNECTION_FAILED', 503);
    }
  });

  // Config route
  const DELIVERY_FEE = parseFloat(process.env.DELIVERY_FEE || "35");
  app.get('/api/v1/config', (req, res) => {
    res.json({ 
      success: true, 
      data: { 
        deliveryFee: DELIVERY_FEE,
        categories: ['Groceries', 'Medicine', 'Vegetables', 'Food']
      }
    });
  });

  // API routes
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/products', productRoutes);
  app.use('/api/v1/orders', orderRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/auth/google', googleAuthRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // Serve uploaded files
  app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));
};
