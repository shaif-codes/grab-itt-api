import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export interface UserAttributes {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null;
  firebaseUid: string | null;
  provider: 'email' | 'google' | 'facebook' | 'apple';
  googleId: string | null;
  profilePictureUrl: string | null;
  emailVerified: boolean;
  role: 'customer' | 'admin';
  phone: string | null;
  addresses: Array<{
    label: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    isDefault: boolean;
  }> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'passwordHash' | 'firebaseUid' | 'googleId' | 'profilePictureUrl' | 'phone' | 'addresses'> { }

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public declare id: string;
  public declare name: string;
  public declare email: string;
  public declare passwordHash: string | null;
  public declare firebaseUid: string | null;
  public declare provider: 'email' | 'google' | 'facebook' | 'apple';
  public declare googleId: string | null;
  public declare profilePictureUrl: string | null;
  public declare emailVerified: boolean;
  public declare role: 'customer' | 'admin';
  public declare phone: string | null;
  public declare addresses: Array<{
    label: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    isDefault: boolean;
  }> | null;
  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;
}

User.init(
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    firebaseUid: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    provider: {
      type: DataTypes.ENUM('email', 'google', 'facebook', 'apple'),
      allowNull: false,
      defaultValue: 'email',
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    profilePictureUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    role: {
      type: DataTypes.ENUM('customer', 'admin'),
      allowNull: false,
      defaultValue: 'customer',
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    addresses: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
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
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
  }
);

export default User;
