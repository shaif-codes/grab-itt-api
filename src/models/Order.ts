import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface OrderAttributes {
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    nameSnapshot: string;
    price: number;
    originalPrice: number;
    quantity: number;
  }>;
  address: {
    label: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  paymentMethod: 'COD' | 'UPI';
  paymentStatus: 'PENDING' | 'PAID';
  upiReferenceId: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'REJECTED' | 'CANCELLED';
  deliveryFee: string;
  subtotal: string;
  total: string;
  assignedRiderName: string | null;
  assignedRiderPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'createdAt' | 'updatedAt' | 'upiReferenceId' | 'assignedRiderName' | 'assignedRiderPhone'> {}

export class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: string;
  public userId!: string;
  public items!: Array<{
    productId: string;
    nameSnapshot: string;
    price: number;
    originalPrice: number;
    quantity: number;
  }>;
  public address!: {
    label: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  public paymentMethod!: 'COD' | 'UPI';
  public paymentStatus!: 'PENDING' | 'PAID';
  public upiReferenceId!: string | null;
  public status!: 'PENDING' | 'ACCEPTED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'REJECTED' | 'CANCELLED';
  public deliveryFee!: string;
  public subtotal!: string;
  public total!: string;
  public assignedRiderName!: string | null;
  public assignedRiderPhone!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    items: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    address: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM('COD', 'UPI'),
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM('PENDING', 'PAID'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    upiReferenceId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    deliveryFee: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    total: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    assignedRiderName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    assignedRiderPhone: {
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
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
  }
);

export default Order;
