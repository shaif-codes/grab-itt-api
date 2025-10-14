import { Request, Response } from 'express';
import productHelper from './productHelper.js';
import multer from 'multer';
import path from 'path';

// Multer setup for file uploads
const upload = multer({
  dest: path.join(process.cwd(), 'uploads/'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

export const uploadMiddleware = upload.single('image');

export class ProductController {
  // Get all products
  static async getAllProducts(req: Request, res: Response) {
    try {
      const { category, search, page = 1, limit = 20 } = req.query;
      
      const filters: any = {};
      if (category) filters.category = category;
      if (search) filters.search = search as string;

      const products = await productHelper.getProducts(filters);
      const total = products.items.length;
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedProducts = products.items.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          products: paginatedProducts,
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

  // Get popular products
  static async getPopularProducts(req: Request, res: Response) {
    try {
      const products = await productHelper.getProducts({ category: 'Food' }); // TODO: after adding popular key in the database, add isPopular: true
      res.json({ success: true, data: products });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get product by ID
  static async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await productHelper.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      res.json({ success: true, data: product });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Create product (Admin only)
  static async createProduct(req: Request, res: Response) {
    try {
      const productData = {
        name: req.body.name,
        category: req.body.category,
        originalPrice: req.body.originalPrice,
        price: req.body.price,
        stock: parseInt(req.body.stock),
        isAvailable: req.body.isAvailable === 'true',
        imageUrl: req.file ? `/api/uploads/${req.file.filename}` : null,
        description: req.body.description,
        isPopular: req.body.isPopular === 'true'
      };

      const product = await productHelper.createProduct(productData);
      res.status(201).json({ success: true, data: product });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update product (Admin only)
  static async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates: any = {};

      if (req.body.name) updates.name = req.body.name;
      if (req.body.category) updates.category = req.body.category;
      if (req.body.originalPrice) updates.originalPrice = req.body.originalPrice;
      if (req.body.price) updates.price = req.body.price;
      if (req.body.stock !== undefined) updates.stock = parseInt(req.body.stock);
      if (req.body.isAvailable !== undefined) updates.isAvailable = req.body.isAvailable === 'true';
      if (req.body.description) updates.description = req.body.description;
      if (req.body.isPopular !== undefined) updates.isPopular = req.body.isPopular === 'true';
      
      if (req.file) {
        updates.imageUrl = `/api/uploads/${req.file.filename}`;
      }

      const updatedProduct = await productHelper.updateProduct(id, updates);
      if (!updatedProduct) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      res.json({ success: true, data: updatedProduct });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Delete product (Admin only)
  static async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await productHelper.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
