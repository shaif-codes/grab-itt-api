import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface ProductAttributes {
  id: string;
  name: string;
  category: 'Groceries' | 'Medicine' | 'Vegetables' | 'Food';
  originalPrice: string;
  price: string;
  stock: number;
  isAvailable: boolean;
  imageUrl: string | null;
  description: string | null;
  isPopular: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'createdAt' | 'updatedAt' | 'imageUrl' | 'description' | 'isPopular'> { }

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public declare id: string;
  public declare name: string;
  public declare category: 'Groceries' | 'Medicine' | 'Vegetables' | 'Food';
  public declare originalPrice: string;
  public declare price: string;
  public declare stock: number;
  public declare isAvailable: boolean;
  public declare imageUrl: string | null;
  public declare description: string | null;
  public declare isPopular: boolean;
  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('Groceries', 'Medicine', 'Vegetables', 'Food'),
      allowNull: false,
    },
    originalPrice: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isPopular: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
  }
);

export default Product;
