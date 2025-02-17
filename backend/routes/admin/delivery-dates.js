const router = require('express').Router();
const jwt = require('jsonwebtoken');
const DeliveryDate = require('../../models/DeliveryDate');
const Order = require('../../models/Order');

// Get admin ID from token
const verifyAdmin = async (req) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return null;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') return null;

        return decoded.id;
    } catch (err) {
        return null;
    }
};

// List all delivery dates with order stats
router.get('/', async (req, res) => {
    try {
        const adminId = await verifyAdmin(req);
        if (!adminId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Update past dates
        await DeliveryDate.updatePastDates();
        
        const dates = await DeliveryDate.find().sort('date');
        
        // Get order statistics for each delivery date
        const dateStats = await Promise.all(dates.map(async (date) => {
            const orders = await Order.find({ deliveryDate: date._id });
            const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
            
            return {
                _id: date._id,
                date: date.date,
                status: date.status,
                orderCount: orders.length,
                totalAmount: totalAmount
            };
        }));

        res.json(dateStats);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new delivery date
router.post('/', async (req, res) => {
    try {
        const adminId = await verifyAdmin(req);
        if (!adminId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { date } = req.body;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        // Set the time to midnight UTC
        const deliveryDate = new Date(date);
        deliveryDate.setUTCHours(0, 0, 0, 0);

        const newDeliveryDate = new DeliveryDate({
            date: deliveryDate,
            status: 'open'
        });

        await newDeliveryDate.save();
        res.status(201).json(newDeliveryDate);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Delivery date already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
