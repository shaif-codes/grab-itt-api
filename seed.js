const { storage } = require('./storage');
const bcrypt = require('bcrypt');

async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // Create admin user
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = await storage.createUser({
      name: process.env.ADMIN_NAME || 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@grabitt.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      phone: '+91 9876543210',
      addresses: [],
    });
    console.log('Admin user created:', adminUser.email);

    // Create demo customer user
    const userPassword = process.env.DEMO_USER_PASSWORD || 'User@123';
    const userPasswordHash = await bcrypt.hash(userPassword, 10);
    
    const demoUser = await storage.createUser({
      name: process.env.DEMO_USER_NAME || 'Demo User',
      email: process.env.DEMO_USER_EMAIL || 'user@grabitt.com',
      passwordHash: userPasswordHash,
      role: 'customer',
      phone: '+91 9876543211',
      addresses: [
        {
          label: 'Home',
          line1: '123 Demo Street',
          line2: 'Near Central Park',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          phone: '+91 9876543211',
          isDefault: true,
        },
        {
          label: 'Office',
          line1: '456 Business Tower',
          line2: 'Floor 5',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400002',
          phone: '+91 9876543211',
          isDefault: false,
        },
      ],
    });
    console.log('Demo user created:', demoUser.email);

    // Create products
    const products = [
      // Groceries
      {
        name: 'Organic Bananas',
        category: 'Groceries',
        originalPrice: '80.00',
        price: '65.00',
        stock: 50,
        isAvailable: true,
        isPopular: true,
        description: 'Fresh organic bananas, 1 dozen pack',
        imageUrl: null,
      },
      {
        name: 'Fresh Milk',
        category: 'Groceries',
        originalPrice: '60.00',
        price: '55.00',
        stock: 0,
        isAvailable: false,
        isPopular: false,
        description: 'Pure cow milk, 1 liter pack',
        imageUrl: null,
      },
      {
        name: 'Basmati Rice',
        category: 'Groceries',
        originalPrice: '450.00',
        price: '399.00',
        stock: 25,
        isAvailable: true,
        isPopular: true,
        description: 'Premium Basmati rice, 5 kg bag',
        imageUrl: null,
      },
      {
        name: 'Cooking Oil',
        category: 'Groceries',
        originalPrice: '180.00',
        price: '165.00',
        stock: 3,
        isAvailable: true,
        isPopular: false,
        description: 'Refined sunflower oil, 1 liter bottle',
        imageUrl: null,
      },
      {
        name: 'Whole Wheat Flour',
        category: 'Groceries',
        originalPrice: '85.00',
        price: '75.00',
        stock: 40,
        isAvailable: true,
        isPopular: true,
        description: 'Fresh ground whole wheat flour, 2 kg pack',
        imageUrl: null,
      },
      {
        name: 'Sugar',
        category: 'Groceries',
        originalPrice: '45.00',
        price: '42.00',
        stock: 60,
        isAvailable: true,
        isPopular: false,
        description: 'Pure white sugar, 1 kg pack',
        imageUrl: null,
      },

      // Vegetables
      {
        name: 'Fresh Tomatoes',
        category: 'Vegetables',
        originalPrice: '40.00',
        price: '35.00',
        stock: 30,
        isAvailable: true,
        isPopular: true,
        description: 'Fresh red tomatoes, 1 kg',
        imageUrl: null,
      },
      {
        name: 'Organic Carrots',
        category: 'Vegetables',
        originalPrice: '50.00',
        price: '45.00',
        stock: 25,
        isAvailable: true,
        isPopular: false,
        description: 'Organic baby carrots, 500g pack',
        imageUrl: null,
      },
      {
        name: 'Green Capsicum',
        category: 'Vegetables',
        originalPrice: '60.00',
        price: '55.00',
        stock: 20,
        isAvailable: true,
        isPopular: false,
        description: 'Fresh green bell peppers, 500g',
        imageUrl: null,
      },
      {
        name: 'Fresh Onions',
        category: 'Vegetables',
        originalPrice: '35.00',
        price: '30.00',
        stock: 45,
        isAvailable: true,
        isPopular: true,
        description: 'Fresh red onions, 2 kg pack',
        imageUrl: null,
      },
      {
        name: 'Spinach Leaves',
        category: 'Vegetables',
        originalPrice: '25.00',
        price: '20.00',
        stock: 15,
        isAvailable: true,
        isPopular: false,
        description: 'Fresh spinach leaves, 250g bundle',
        imageUrl: null,
      },

      // Medicine
      {
        name: 'Paracetamol Tablets',
        category: 'Medicine',
        originalPrice: '25.00',
        price: '22.00',
        stock: 100,
        isAvailable: true,
        isPopular: true,
        description: 'Pain relief tablets, 10 tablets pack',
        imageUrl: null,
      },
      {
        name: 'Vitamin C Tablets',
        category: 'Medicine',
        originalPrice: '120.00',
        price: '105.00',
        stock: 50,
        isAvailable: true,
        isPopular: false,
        description: 'Vitamin C supplements, 30 tablets',
        imageUrl: null,
      },
      {
        name: 'Hand Sanitizer',
        category: 'Medicine',
        originalPrice: '80.00',
        price: '70.00',
        stock: 75,
        isAvailable: true,
        isPopular: true,
        description: 'Alcohol-based hand sanitizer, 100ml',
        imageUrl: null,
      },
      {
        name: 'Digital Thermometer',
        category: 'Medicine',
        originalPrice: '350.00',
        price: '299.00',
        stock: 10,
        isAvailable: true,
        isPopular: false,
        description: 'Digital fever thermometer',
        imageUrl: null,
      },

      // Food
      {
        name: 'Bread Loaf',
        category: 'Food',
        originalPrice: '35.00',
        price: '32.00',
        stock: 20,
        isAvailable: true,
        isPopular: true,
        description: 'Fresh whole wheat bread loaf',
        imageUrl: null,
      },
      {
        name: 'Instant Noodles',
        category: 'Food',
        originalPrice: '15.00',
        price: '12.00',
        stock: 80,
        isAvailable: true,
        isPopular: true,
        description: 'Masala instant noodles, 2-minute cook',
        imageUrl: null,
      },
      {
        name: 'Biscuits Pack',
        category: 'Food',
        originalPrice: '40.00',
        price: '35.00',
        stock: 60,
        isAvailable: true,
        isPopular: false,
        description: 'Cream biscuits family pack',
        imageUrl: null,
      },
      {
        name: 'Ready to Eat Curry',
        category: 'Food',
        originalPrice: '85.00',
        price: '75.00',
        stock: 30,
        isAvailable: true,
        isPopular: false,
        description: 'Paneer curry ready to eat, 300g',
        imageUrl: null,
      },
      {
        name: 'Energy Bars',
        category: 'Food',
        originalPrice: '150.00',
        price: '135.00',
        stock: 25,
        isAvailable: true,
        isPopular: false,
        description: 'Protein energy bars, 6 pack',
        imageUrl: null,
      },
    ];

    for (const productData of products) {
      const product = await storage.createProduct(productData);
      console.log('Product created:', product.name);
    }

    // Create offers
    const offers = [
      {
        title: '50% OFF',
        description: 'On your first order above ₹299',
        imageUrl: null,
        active: true,
      },
      {
        title: 'FREE DELIVERY',
        description: 'Free delivery on orders above ₹500',
        imageUrl: null,
        active: true,
      },
    ];

    for (const offerData of offers) {
      const offer = await storage.createOffer(offerData);
      console.log('Offer created:', offer.title);
    }

    // Update categories with descriptions
    const categoryUpdates = [
      { name: 'Groceries', backgroundImageUrl: null },
      { name: 'Medicine', backgroundImageUrl: null },
      { name: 'Vegetables', backgroundImageUrl: null },
      { name: 'Food', backgroundImageUrl: null },
    ];

    for (const update of categoryUpdates) {
      await storage.updateCategory(update.name, update);
      console.log('Category updated:', update.name);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin Panel:');
    console.log(`  Email: ${adminUser.email}`);
    console.log(`  Password: ${adminPassword}`);
    console.log('\nCustomer App:');
    console.log(`  Email: ${demoUser.email}`);
    console.log(`  Password: ${userPassword}`);
    console.log('\n🚀 You can now start the application!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
