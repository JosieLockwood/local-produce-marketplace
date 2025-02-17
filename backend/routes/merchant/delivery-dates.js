const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const MerchantShop = require('../../models/MerchantShop');
const Order = require('../../models/Order');
const DeliveryDate = require('../../models/DeliveryDate');

// Get merchant shop from token
const getMerchantShop = async (req) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return null;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'merchant') return null;

        return await MerchantShop.findOne({ userId: decoded.id });
    } catch (err) {
        return null;
    }
};

// Get upcoming delivery dates with order counts
router.get('/', async (req, res) => {
    try {
        const shop = await getMerchantShop(req);
        if (!shop) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const dates = await DeliveryDate.find({
            status: { $ne: 'past' }
        }).sort({ date: 1 }).limit(3);

        // Get orders count for each date
        const datesWithOrders = await Promise.all(dates.map(async (date) => {
            const orders = await Order.countDocuments({
                'merchantOrders.merchant': shop._id,
                deliveryDate: date._id
            });
            return {
                ...date.toObject(),
                orderCount: orders
            };
        }));

        res.json(datesWithOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
