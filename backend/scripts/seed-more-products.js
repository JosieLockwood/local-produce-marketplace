const mongoose = require('mongoose');
const Product = require('../models/Product');
const MerchantShop = require('../models/MerchantShop');

async function seedMoreProducts() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/local-produce', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Get merchant IDs
        const greenValleyFarm = await MerchantShop.findOne({ businessName: 'Green Valley Farm' });
        const artisanBreads = await MerchantShop.findOne({ businessName: 'Artisan Breads' });

        // More products for Green Valley Farm
        const greenValleyProducts = [
            {
                merchantId: greenValleyFarm._id,
                item: 'Fresh Spinach',
                description: 'Locally grown organic spinach',
                price: 2.99,
                unit: 'bunch',
                category: 'vegetables',
                localityCategory: 'own_product',
                inStock: true,
                status: 'approved'
            },
            {
                merchantId: greenValleyFarm._id,
                item: 'Cherry Tomatoes',
                description: 'Sweet and juicy cherry tomatoes',
                price: 3.50,
                unit: 'punnet',
                category: 'vegetables',
                localityCategory: 'own_product',
                inStock: true,
                status: 'approved'
            },
            {
                merchantId: greenValleyFarm._id,
                item: 'Fresh Milk',
                description: 'Farm fresh whole milk',
                price: 2.20,
                unit: 'litre',
                category: 'dairy',
                localityCategory: 'own_product',
                inStock: true,
                status: 'approved'
            }
        ];

        // More products for Artisan Breads
        const artisanProducts = [
            {
                merchantId: artisanBreads._id,
                item: 'Rye Bread',
                description: 'Traditional rye bread',
                price: 3.99,
                unit: 'loaf',
                category: 'bakery',
                localityCategory: 'own_product',
                inStock: true,
                status: 'approved'
            },
            {
                merchantId: artisanBreads._id,
                item: 'Croissants',
                description: 'Freshly baked butter croissants',
                price: 1.99,
                unit: 'piece',
                category: 'bakery',
                localityCategory: 'own_product',
                inStock: true,
                status: 'approved'
            },
            {
                merchantId: artisanBreads._id,
                item: 'Baguette',
                description: 'Traditional French baguette',
                price: 2.50,
                unit: 'piece',
                category: 'bakery',
                localityCategory: 'own_product',
                inStock: true,
                status: 'approved'
            }
        ];

        // Insert all products
        await Product.insertMany([...greenValleyProducts, ...artisanProducts]);

        console.log('Additional products seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding products:', error);
        process.exit(1);
    }
}

seedMoreProducts();
