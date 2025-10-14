import sequelize from '../config/database.js';
import User from './User.js';
import Product from './Product.js';
import Order from './Order.js';
import Category from './Category.js';
import Offer from './Offer.js';

// Define associations
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Initialize database connection
export const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

// Manual database sync function
export const syncDatabase = async (force: boolean = false) => {
  try {
    console.log('🔄 Starting database synchronization...');
    await sequelize.sync({ force, alter: !force });
    console.log('✅ Database synchronized successfully.');
    return { success: true, message: 'Database synchronized successfully' };
  } catch (error: any) {
    console.error('❌ Database synchronization failed:', error);
    return { success: false, message: 'Database synchronization failed', error: error.message };
  }
};

export { sequelize, User, Product, Order, Category, Offer };
export default sequelize;
