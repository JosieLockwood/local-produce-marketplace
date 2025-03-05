const router = require('express').Router();
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const Rating = require('../../models/Rating');
const MerchantShop = require('../../models/MerchantShop');
const jwt = require('jsonwebtoken');

// Get merchant ID from token
const getMerchantId = async (req) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return null;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'merchant') return null;

        const shop = await MerchantShop.findOne({ userId: decoded.id });
        return shop?._id;
    } catch (err) {
        return null;
    }
};

// Get product statistics for merchant
router.get('/products', async (req, res) => {
    try {
        const merchantId = await getMerchantId(req);
        if (!merchantId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Get all products for merchant
        const products = await Product.find({ merchantId });
        const productStats = [];

        for (const product of products) {
            // Get ratings
            const ratings = await Rating.find({ productId: product._id });
            const avgRating = ratings.length > 0 
                ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length 
                : 0;

            // Get order count
            const orderCount = await Order.countDocuments({
                'merchantOrders.items.product': product._id
            });

            productStats.push({
                _id: product._id,
                item: product.item,
                image: product.image,
                price: product.price,
                unit: product.unit,
                avgRating,
                totalRatings: ratings.length,
                orderCount,
                ratings: ratings.map(r => ({
                    rating: r.rating,
                    comment: r.comment,
                    createdAt: r.createdAt
                }))
            });
        }

        res.json(productStats);
    } catch (error) {
        console.error('Error getting product stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get order statistics by delivery date
router.get('/orders', async (req, res) => {
    try {
        const merchantId = await getMerchantId(req);
        if (!merchantId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Get all orders for this merchant grouped by delivery date
        const orderStats = await Order.aggregate([
            {
                $match: {
                    'merchantOrders.merchant': merchantId
                }
            },
            {
                $lookup: {
                    from: 'deliverydates',
                    localField: 'deliveryDate',
                    foreignField: '_id',
                    as: 'deliveryDateInfo'
                }
            },
            {
                $unwind: '$deliveryDateInfo'
            },
            {
                $group: {
                    _id: '$deliveryDate',
                    date: { $first: '$deliveryDateInfo.date' },
                    status: { $first: '$deliveryDateInfo.status' },
                    totalOrders: { $sum: 1 }
                }
            },
            {
                $sort: { date: -1 }
            }
        ]);

        res.json(orderStats);
    } catch (error) {
        console.error('Error getting order stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
