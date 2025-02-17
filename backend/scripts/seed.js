const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const MerchantShop = require('../models/MerchantShop');
const Product = require('../models/Product');
const DeliveryDate = require('../models/DeliveryDate');

mongoose.connect('mongodb://localhost:27017/local-produce', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const seed = async () => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await MerchantShop.deleteMany({});
        await Product.deleteMany({});
        await DeliveryDate.deleteMany({});

        // Create admin
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
            email: 'admin@local.com',
            password: adminPassword,
            name: 'Admin User',
            role: 'admin'
        });

        // Create customer
        const customerPassword = await bcrypt.hash('customer123', 10);
        const customer = await User.create({
            email: 'customer@local.com',
            password: customerPassword,
            name: 'Test Customer',
            role: 'customer'
        });

        // Create merchants
        const merchants = [
            {
                email: 'farm@local.com',
                name: 'John Farm',
                business: 'Green Valley Farm',
                category: 'Farmer',
                description: 'Fresh vegetables and fruits from our family farm',
                location: 'Green Valley',
                products: [
                    {
                        item: 'Organic Carrots',
                        description: 'Fresh organic carrots',
                        price: 2.50,
                        unit: 'bunch',
                        category: 'Vegetables',
                        localityCategory: 'own_product'
                    },
                    {
                        item: 'Free Range Eggs',
                        description: 'Farm fresh free range eggs',
                        price: 3.99,
                        unit: 'dozen',
                        category: 'Dairy',
                        localityCategory: 'own_product'
                    }
                ]
            },
            {
                email: 'bakery@local.com',
                name: 'Mary Baker',
                business: 'Artisan Breads',
                category: 'Bakery',
                description: 'Freshly baked artisan breads and pastries',
                location: 'Town Center',
                products: [
                    {
                        item: 'Sourdough Bread',
                        description: 'Traditional sourdough bread',
                        price: 4.50,
                        unit: 'loaf',
                        category: 'Bread',
                        localityCategory: 'own_product'
                    },
                    {
                        item: 'Croissants',
                        description: 'Butter croissants',
                        price: 2.50,
                        unit: 'piece',
                        category: 'Pastries',
                        localityCategory: 'own_product'
                    }
                ]
            }
        ];

        // Create merchant users and their shops
        for (const m of merchants) {
            // Create merchant user
            const password = await bcrypt.hash('merchant123', 10);
            const merchant = await User.create({
                email: m.email,
                password: password,
                name: m.name,
                role: 'merchant'
            });

            // Create merchant shop linked to user
            const shop = await MerchantShop.create({
                userId: merchant._id,
                businessName: m.business,
                description: m.description,
                category: m.category,
                locationString: m.location,
                coordinates: { lat: 51.5074, lng: -0.1278 }, // Example coordinates
                status: 'approved'
            });

            // Create products for this merchant
            for (const p of m.products) {
                await Product.create({
                    ...p,
                    merchantId: shop._id,
                    status: 'approved'
                });
            }
        }

        // Create delivery dates (next 7 days)
        const dates = [];
        for (let i = 1; i <= 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            dates.push(date);
        }

        for (const date of dates) {
            await DeliveryDate.create({
                date,
                status: 'open'
            });
        }

        console.log('Database seeded! 🌱');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
};

seed();
