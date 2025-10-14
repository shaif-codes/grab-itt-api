import { Request, Response } from 'express';
import orderHelper from './orderHelper.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';

const DELIVERY_FEE = parseFloat(process.env.DELIVERY_FEE || "35");

export class OrderController {
  // Create order
  static async createOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const { items, address, paymentMethod, upiReferenceId } = req.body;

      // Calculate totals
      const subtotal = items.reduce((sum: number, item: any) => 
        sum + (parseFloat(item.price) * item.quantity), 0
      );
      const total = subtotal + DELIVERY_FEE;

      const orderData = {
        userId,
        items,
        address,
        paymentMethod,
        upiReferenceId: upiReferenceId || null,
        status: 'PENDING' as const,
        paymentStatus: 'PENDING' as const,
        deliveryFee: DELIVERY_FEE.toString(),
        subtotal: subtotal.toString(),
        total: total.toString()
      };

      const order = await orderHelper.createOrder(orderData);
      res.status(201).json({ success: true, data: order });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get user orders
  static async getUserOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const orders = await orderHelper.getUserOrders(userId);
      res.json({ success: true, data: orders });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get order by ID
  static async getOrderById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const order = await orderHelper.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      res.json({ success: true, data: order });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update order status (Admin only)
  static async updateOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, assignedRiderName, assignedRiderPhone } = req.body;

      const updates: any = { status };
      if (assignedRiderName) updates.assignedRiderName = assignedRiderName;
      if (assignedRiderPhone) updates.assignedRiderPhone = assignedRiderPhone;

      const updatedOrder = await orderHelper.updateOrderStatus(id, status, updates);
      if (!updatedOrder) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      res.json({ success: true, data: updatedOrder });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get all orders (Admin only)
  static async getAllOrders(req: Request, res: Response) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status;

      const orders = await orderHelper.getAllOrders(filters);
      const total = orders.length;
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedOrders = orders.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          orders: paginatedOrders,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalItems: total,
            itemsPerPage: Number(limit)
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
