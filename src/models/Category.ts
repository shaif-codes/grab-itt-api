import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface CategoryAttributes {
  id: string;
  name: 'Groceries' | 'Medicine' | 'Vegetables' | 'Food';
  icon: string | null;
  backgroundImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id' | 'createdAt' | 'updatedAt' | 'icon' | 'backgroundImageUrl'> { }

export class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: string;
  public name!: 'Groceries' | 'Medicine' | 'Vegetables' | 'Food';
  public icon!: string | null;
  public backgroundImageUrl!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.ENUM('Groceries', 'Medicine', 'Vegetables', 'Food'),
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    backgroundImageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
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
    modelName: 'Category',
    tableName: 'categories',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['name']
      }
    ]
  }
);

export default Category;
