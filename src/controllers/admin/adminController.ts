import { Request, Response } from 'express';
import { syncDatabase } from '../../models/index.js';
import { Order } from '../../models/Order.js';
import { User } from '../../models/User.js';
import { Offer } from '../../models/Offer.js';
import NotificationService from '../../services/NotificationService.js';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from '../../config/constants.js';
export class AdminController {
  // Sync database schema
  static async syncDatabase(req: Request, res: Response) {
    try {
      const force = req.query.force === 'true';
      const result = await syncDatabase(force);

      if (result.success) {
        res.json({ success: true, message: result.message });
      } else {
        res.status(500).json({ success: false, message: result.message, error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Database sync failed', error: error.message });
    }
  }

  static async getOrders(req: Request, res: Response) {
    try {
      const { status, customer } = req.query;
      const where: any = {};

      if (status) where.status = status;
      if (customer) where.userId = customer;

      const orders = await Order.findAll({
        where,
        order: [['createdAt', 'DESC']],
        include: [{ model: User, attributes: ['id', 'name', 'email', 'phone'] }]
      });

      res.json({ success: true, data: orders });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
    }
  }

  static async updateOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, assignedRiderName, assignedRiderPhone } = req.body;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      order.status = status;
      if (assignedRiderName) order.assignedRiderName = assignedRiderName;
      if (assignedRiderPhone) order.assignedRiderPhone = assignedRiderPhone;

      await order.save();
      res.json({ success: true, data: order });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to update order', error: error.message });
    }
  }

  static async getUsers(req: Request, res: Response) {
    try {
      const users = await User.findAll({
        where: { role: 'customer' },
        attributes: { exclude: ['passwordHash'] },
        order: [['createdAt', 'DESC']]
      });
      res.json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const totalOrders = await Order.count();
      const pendingOrders = await Order.count({ where: { status: 'PENDING' } });
      const totalRevenue = await Order.sum('total') || 0;
      const totalUsers = await User.count({ where: { role: 'customer' } });

      res.json({
        success: true,
        data: {
          totalOrders,
          pendingOrders,
          totalRevenue,
          totalUsers
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
    }
  }

  static async createOffer(req: Request, res: Response) {
    try {
      const { title, description, imageUrl, active } = req.body;

      const offer = await Offer.create({
        title,
        description,
        imageUrl,
        active: active !== undefined ? active : true
      });

      // Send notification to all users
      // Note: In a real app, we might want to use a topic or batch this
      const users = await User.findAll({ where: { role: 'customer' } });

      // We'll fire and forget the notifications to not block the response
      Promise.all(users.map(user =>
        NotificationService.create({
          userId: user.id,
          type: NOTIFICATION_TYPES.MARKETING,
          title: `New Offer: ${title}`,
          message: description,
          priority: NOTIFICATION_PRIORITY.MEDIUM,
          data: { offerId: offer.id }
        })
      )).catch(err => console.error('Failed to send offer notifications', err));

      res.status(201).json({ success: true, data: offer });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to create offer', error: error.message });
    }
  }

  static async getOffers(req: Request, res: Response) {
    try {
      const offers = await Offer.findAll({
        order: [['createdAt', 'DESC']]
      });
      res.json({ success: true, data: offers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch offers', error: error.message });
    }
  }

  static async updateOffer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, imageUrl, active } = req.body;

      const offer = await Offer.findByPk(id);
      if (!offer) {
        return res.status(404).json({ success: false, message: 'Offer not found' });
      }

      await offer.update({
        title,
        description,
        imageUrl,
        active
      });

      res.json({ success: true, data: offer });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to update offer', error: error.message });
    }
  }

  static async deleteOffer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const offer = await Offer.findByPk(id);

      if (!offer) {
        return res.status(404).json({ success: false, message: 'Offer not found' });
      }

      await offer.destroy();
      res.json({ success: true, message: 'Offer deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to delete offer', error: error.message });
    }
  }
}
