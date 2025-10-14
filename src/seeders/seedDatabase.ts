import { Category, Offer } from '../models/index.js';

export const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Seed categories
    const categories = [
      { name: 'Groceries' as const, icon: 'fas fa-shopping-basket' },
      { name: 'Medicine' as const, icon: 'fas fa-pills' },
      { name: 'Vegetables' as const, icon: 'fas fa-carrot' },
      { name: 'Food' as const, icon: 'fas fa-utensils' },
    ];

    for (const categoryData of categories) {
      await Category.findOrCreate({
        where: { name: categoryData.name },
        defaults: categoryData,
      });
    }

    console.log('✅ Categories seeded successfully');

    // Seed sample offers
    const offers = [
      {
        title: 'Free Delivery',
        description: 'Get free delivery on orders above ₹500',
        active: true,
      },
      {
        title: 'New User Discount',
        description: 'Get 10% off on your first order',
        active: true,
      },
    ];

    for (const offerData of offers) {
      await Offer.findOrCreate({
        where: { title: offerData.title },
        defaults: offerData,
      });
    }

    console.log('✅ Offers seeded successfully');
    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};
