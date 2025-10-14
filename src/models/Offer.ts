import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface OfferAttributes {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfferCreationAttributes extends Optional<OfferAttributes, 'id' | 'createdAt' | 'updatedAt' | 'imageUrl' | 'active'> {}

export class Offer extends Model<OfferAttributes, OfferCreationAttributes> implements OfferAttributes {
  public id!: string;
  public title!: string;
  public description!: string;
  public imageUrl!: string | null;
  public active!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Offer.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    modelName: 'Offer',
    tableName: 'offers',
    timestamps: true,
  }
);

export default Offer;
