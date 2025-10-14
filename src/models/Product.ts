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

export interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'createdAt' | 'updatedAt' | 'imageUrl' | 'description' | 'isPopular'> {}

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: string;
  public name!: string;
  public category!: 'Groceries' | 'Medicine' | 'Vegetables' | 'Food';
  public originalPrice!: string;
  public price!: string;
  public stock!: number;
  public isAvailable!: boolean;
  public imageUrl!: string | null;
  public description!: string | null;
  public isPopular!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
