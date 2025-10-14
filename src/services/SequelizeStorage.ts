import { Op } from 'sequelize';
import { User, Product, Order, Category, Offer } from '../models/index.js';

export class SequelizeStorage {
  // User methods
  async getUser(id: string): Promise<any | undefined> {
    const user = await User.findByPk(id);
    return user?.toJSON();
  }

  async getUserByEmail(email: string): Promise<any | undefined> {
    const user = await User.findOne({ where: { email } });
    return user?.toJSON();
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<any | undefined> {
    const user = await User.findOne({ where: { firebaseUid } });
    return user?.toJSON();
  }

  async createUser(userData: Partial<any>): Promise<any> {
    const user = await User.create(userData as any);
    return user.toJSON();
  }

  async updateUser(id: string, updates: Partial<any>): Promise<any | undefined> {
    const [affectedCount] = await User.update(updates, { where: { id } });
    if (affectedCount > 0) {
      const user = await User.findByPk(id);
      return user?.toJSON();
    }
    return undefined;
  }

  // Product methods
  async getProducts(options: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ items: any[]; total: number; page: number; pages: number }> {
    const { search, category, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    if (category) {
      where.category = category;
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      items: rows.map(row => row.toJSON()),
      total: count,
      page,
      pages: Math.ceil(count / limit),
    };
  }

  async getProduct(id: string): Promise<any | undefined> {
    const product = await Product.findByPk(id);
    return product?.toJSON();
  }

  async getPopularProducts(limit: number = 6): Promise<any[]> {
    const products = await Product.findAll({
      where: { isPopular: true, isAvailable: true },
      limit,
      order: [['createdAt', 'DESC']],
    });
    return products.map(product => product.toJSON());
  }

  async createProduct(productData: Partial<any>): Promise<any> {
    const product = await Product.create(productData as any);
    return product.toJSON();
  }

  async updateProduct(id: string, updates: Partial<any>): Promise<any | undefined> {
    const [affectedCount] = await Product.update(updates, { where: { id } });
    if (affectedCount > 0) {
      const product = await Product.findByPk(id);
      return product?.toJSON();
    }
    return undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const deletedCount = await Product.destroy({ where: { id } });
    return deletedCount > 0;
  }

  async decrementStock(productId: string, quantity: number): Promise<boolean> {
    const product = await Product.findByPk(productId);
    if (!product || product.stock < quantity) {
      return false;
    }
    
    await Product.update(
      { stock: product.stock - quantity },
      { where: { id: productId } }
    );
    return true;
  }

  // Order methods
  async createOrder(orderData: Partial<any>): Promise<any> {
    const order = await Order.create(orderData as any);
    return order.toJSON();
  }

  async getOrder(id: string): Promise<any | undefined> {
    const order = await Order.findByPk(id);
    return order?.toJSON();
  }

  async getUserOrders(userId: string): Promise<any[]> {
    const orders = await Order.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
    return orders.map(order => order.toJSON());
  }

  async getAllOrders(options: { status?: string } = {}): Promise<any[]> {
    const where: any = {};
    if (options.status) {
      where.status = options.status;
    }

    const orders = await Order.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    return orders.map(order => order.toJSON());
  }

  async updateOrderStatus(
    id: string, 
    status: string, 
    riderInfo?: { assignedRiderName?: string; assignedRiderPhone?: string }
  ): Promise<any | undefined> {
    const updates: any = { status };
    if (riderInfo) {
      if (riderInfo.assignedRiderName) updates.assignedRiderName = riderInfo.assignedRiderName;
      if (riderInfo.assignedRiderPhone) updates.assignedRiderPhone = riderInfo.assignedRiderPhone;
    }

    const [affectedCount] = await Order.update(updates, { where: { id } });
    if (affectedCount > 0) {
      const order = await Order.findByPk(id);
      return order?.toJSON();
    }
    return undefined;
  }

  // Category methods
  async getCategories(): Promise<any[]> {
    const categories = await Category.findAll({
      order: [['name', 'ASC']],
    });
    return categories.map(category => category.toJSON());
  }

  async createCategory(categoryData: Partial<any>): Promise<any> {
    const category = await Category.create(categoryData as any);
    return category.toJSON();
  }

  async updateCategory(name: string, updates: Partial<any>): Promise<any | undefined> {
    const [affectedCount] = await Category.update(updates, { where: { name } });
    if (affectedCount > 0) {
      const category = await Category.findOne({ where: { name } });
      return category?.toJSON();
    }
    return undefined;
  }

  // Offer methods
  async getActiveOffers(): Promise<any[]> {
    const offers = await Offer.findAll({
      where: { active: true },
      order: [['createdAt', 'DESC']],
    });
    return offers.map(offer => offer.toJSON());
  }

  async createOffer(offerData: Partial<any>): Promise<any> {
    const offer = await Offer.create(offerData as any);
    return offer.toJSON();
  }

  async updateOffer(id: string, updates: Partial<any>): Promise<any | undefined> {
    const [affectedCount] = await Offer.update(updates, { where: { id } });
    if (affectedCount > 0) {
      const offer = await Offer.findByPk(id);
      return offer?.toJSON();
    }
    return undefined;
  }

  async deleteOffer(id: string): Promise<boolean> {
    const deletedCount = await Offer.destroy({ where: { id } });
    return deletedCount > 0;
  }
}

export default new SequelizeStorage();
