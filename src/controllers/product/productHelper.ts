import { Op } from "sequelize";
import { Product } from "../../models/index.js";

const productHelper = {
   // Product methods
   getProducts: async (
    options: {
      search?: string;
      category?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ items: any[]; total: number; page: number; pages: number }> => {
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
      order: [["createdAt", "DESC"]],
    });

    return {
      items: rows.map((row) => row.toJSON()),
      total: count,
      page,
      pages: Math.ceil(count / limit),
    };
  },

  getProduct: async (id: string): Promise<any | undefined> => {
    const product = await Product.findByPk(id);
    return product?.toJSON();
  },

  getPopularProducts: async (limit: number = 6): Promise<any[]> => {
    const products = await Product.findAll({
      where: { isPopular: true, isAvailable: true },
      limit,
      order: [["createdAt", "DESC"]],
    });
    return products.map((product) => product.toJSON());
  },

  createProduct: async (productData: Partial<any>): Promise<any> => {
    const product = await Product.create(productData as any);
    return product.toJSON();
  },

  updateProduct: async (
    id: string,
    updates: Partial<any>
  ): Promise<any | undefined> => {
    const [affectedCount] = await Product.update(updates, { where: { id } });
    if (affectedCount > 0) {
      const product = await Product.findByPk(id);
      return product?.toJSON();
    }
    return undefined;
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    const deletedCount = await Product.destroy({ where: { id } });
    return deletedCount > 0;
  },

  decrementStock: async (
    productId: string,
    quantity: number
  ): Promise<boolean> => {
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
};

export default productHelper;
