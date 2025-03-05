const express = require('express');
const router = express.Router();
const Rating = require('../../models/Rating');
const Product = require('../../models/Product');
const jwt = require('jsonwebtoken');

// Submit a rating
router.post('/', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'Token required' });

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (verified.role !== 'customer') {
            return res.status(401).json({ message: 'Invalid token' });
        }

        const { productId, rating, comment } = req.body;
        
        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Create or update rating with userId
        const ratingDoc = await Rating.findOneAndUpdate(
            { productId, userId: verified.userId },
            { rating, comment },
            { upsert: true, new: true }
        );

        res.json(ratingDoc);
    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get ratings for a product
router.get('/product/:productId', async (req, res) => {
    try {
        const ratings = await Rating.find({ productId: req.params.productId })
            .sort('-createdAt');

        // Calculate average rating
        const avgRating = ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length;

        res.json({
            ratings,
            averageRating: ratings.length > 0 ? avgRating : 0,
            totalRatings: ratings.length
        });
    } catch (error) {
        console.error('Error getting ratings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get reviews for a product
router.get('/product/:productId/reviews', async (req, res) => {
    try {
        const ratings = await Rating.find({ productId: req.params.productId })
            .select('rating comment createdAt')
            .sort('-createdAt');
        
        res.json(ratings);
    } catch (error) {
        console.error('Error fetching product reviews:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get ratings for a merchant's products
router.get('/merchant/:merchantId', async (req, res) => {
    try {
        // Get all products for the merchant
        const products = await Product.find({ merchantId: req.params.merchantId });
        const productIds = products.map(p => p._id);

        // Get all ratings for these products
        const ratings = await Rating.find({ productId: { $in: productIds } })
            .populate('productId', 'item price')
            .sort('-createdAt');

        res.json(ratings);
    } catch (error) {
        console.error('Error getting merchant ratings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
