const express = require('express');
const router = express.Router();
const Product = require('../../models/Product');
const MerchantShop = require('../../models/MerchantShop');
const Rating = require('../../models/Rating');

// Get all products with merchant info and ratings
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find({ 
            status: 'approved'
        })
            .populate('merchantId', 'businessName locationString');

        // Get ratings for all products
        const productRatings = await Promise.all(products.map(async product => {
            const ratings = await Rating.find({ productId: product._id });
            const avgRating = ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length;
            return {
                ...product.toObject(),
                averageRating: ratings.length > 0 ? avgRating : 0,
                totalRatings: ratings.length
            };
        }));

        res.json(productRatings);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all active merchants
router.get('/merchants', async (req, res) => {
    try {
        const merchants = await MerchantShop.find({ 
            status: 'approved' 
        }).select('_id businessName description locationString category image coordinates');
        
        res.json(merchants);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get specific merchant with their products
router.get('/merchants/:merchantId', async (req, res) => {
    try {
        const merchant = await MerchantShop.findOne({
            _id: req.params.merchantId,
            status: 'approved'
        }).select('_id businessName description locationString category image');
        
        if (!merchant) {
            return res.status(404).json({ message: 'Merchant not found' });
        }

        const products = await Product.find({
            merchantId: req.params.merchantId,
            status: 'approved'
        });

        res.json({
            merchant,
            products
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
