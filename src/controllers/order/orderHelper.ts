import { Order } from "../../models/index.js";

const orderHelper = {
  // Order methods
  createOrder: async (orderData: Partial<any>): Promise<any> => {
    const order = await Order.create(orderData as any);
    return order.toJSON();
  },

  getOrder: async (id: string): Promise<any | undefined> => {
    const order = await Order.findByPk(id);
    return order?.toJSON();
  },

  getUserOrders: async (userId: string): Promise<any[]> => {
    const orders = await Order.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });
    return orders.map((order) => order.toJSON());
  },

  getAllOrders: async (options: { status?: string } = {}): Promise<any[]> => {
    const where: any = {};
    if (options.status) {
      where.status = options.status;
    }

    const orders = await Order.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    return orders.map((order) => order.toJSON());
  },

  updateOrderStatus: async (
    id: string,
    status: string,
    riderInfo?: { assignedRiderName?: string; assignedRiderPhone?: string }
  ): Promise<any | undefined> => {
    const updates: any = { status };
    if (riderInfo) {
      if (riderInfo.assignedRiderName)
        updates.assignedRiderName = riderInfo.assignedRiderName;
      if (riderInfo.assignedRiderPhone)
        updates.assignedRiderPhone = riderInfo.assignedRiderPhone;
    }

    const [affectedCount] = await Order.update(updates, { where: { id } });
    if (affectedCount > 0) {
      const order = await Order.findByPk(id);
      return order?.toJSON();
    }
    return undefined;
  }
};

export default orderHelper;