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
                maxOrders: date.maxOrders,
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

        const { date, maxOrders } = req.body;
        if (!date || !maxOrders) {
            return res.status(400).json({ message: 'Date and maximum orders are required' });
        }

        if (maxOrders < 1) {
            return res.status(400).json({ message: 'Maximum orders must be at least 1' });
        }

        // Set the time to midnight UTC
        const deliveryDate = new Date(date);
        deliveryDate.setUTCHours(0, 0, 0, 0);

        const newDeliveryDate = new DeliveryDate({
            date: deliveryDate,
            status: 'open',
            maxOrders
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

// Update delivery date
router.patch('/:id', async (req, res) => {
    try {
        const adminId = await verifyAdmin(req);
        if (!adminId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { maxOrders, status } = req.body;
        const updateData = {};

        if (maxOrders !== undefined) {
            if (maxOrders < 1) {
                return res.status(400).json({ message: 'Maximum orders must be at least 1' });
            }
            updateData.maxOrders = maxOrders;
        }

        if (status !== undefined) {
            if (!['open', 'closed', 'full'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status' });
            }
            updateData.status = status;
        }

        const deliveryDate = await DeliveryDate.findById(req.params.id);
        if (!deliveryDate) {
            return res.status(404).json({ message: 'Delivery date not found' });
        }

        if (deliveryDate.status === 'past') {
            return res.status(400).json({ message: 'Cannot update past delivery dates' });
        }

        // If maxOrders is being reduced, check if it's still above current order count
        if (maxOrders) {
            const orderCount = await Order.countDocuments({ deliveryDate: deliveryDate._id });
            if (orderCount > maxOrders) {
                return res.status(400).json({ message: 'Cannot set maximum orders below current order count' });
            }
        }

        Object.assign(deliveryDate, updateData);
        await deliveryDate.save();
        
        // Check if status should be updated to full
        await DeliveryDate.checkAndUpdateFullStatus(deliveryDate._id);

        res.json(deliveryDate);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete delivery date
router.delete('/:id', async (req, res) => {
    try {
        const adminId = await verifyAdmin(req);
        if (!adminId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const date = await DeliveryDate.findById(req.params.id);
        if (!date) {
            return res.status(404).json({ message: 'Delivery date not found' });
        }

        // Check if there are any orders for this date
        const orderCount = await Order.countDocuments({ deliveryDate: date._id });
        if (orderCount > 0) {
            return res.status(400).json({ message: 'Cannot delete delivery date with orders' });
        }

        await date.deleteOne();
        res.json({ message: 'Delivery date deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
