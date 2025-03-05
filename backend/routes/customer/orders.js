const router = require('express').Router();
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const DeliveryDate = require('../../models/DeliveryDate');
const jwt = require('jsonwebtoken');

// Get available delivery dates (public)
router.get('/delivery-dates', async (req, res) => {
    try {
        const dates = await DeliveryDate.find({ 
            status: 'open',
            date: { $gt: new Date() }
        });
        
        res.json(dates);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Place a new order
router.post('/place-order', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Token required' });
        }

        // Get user from token
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (verified.role !== 'customer') {
            return res.status(401).json({ message: 'Invalid token' });
        }

        const { merchantOrders, deliveryDateId, totalAmount } = req.body;

        // Verify delivery date is valid
        const deliveryDate = await DeliveryDate.findOne({
            _id: deliveryDateId,
            status: 'open'
        });
        
        if (!deliveryDate) {
            return res.status(400).json({ message: 'Invalid delivery date' });
        }

        const order = new Order({
            customer: verified.id,
            merchantOrders,
            deliveryDate: deliveryDateId,
            totalAmount
        });

        await order.save();
        res.status(201).json(order);
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Get customer's orders
router.get('/my-orders', async (req, res) => {
    console.log('=== /my-orders route hit ===');
    console.log('Headers:', req.headers);
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log('Token:', token);
        if (!token) {
            console.log('No token provided');
            return res.status(401).json({ message: 'Token required' });
        }

        // Get user from token
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified, payload:', verified);
        if (verified.role !== 'customer') {
            console.log('Invalid role:', verified.role);
            return res.status(401).json({ message: 'Invalid token' });
        }

        console.log('Looking for orders with customer:', verified.id);
        const orders = await Order.find({ customer: verified.id })
            .populate('merchantOrders.merchant', 'businessName')
            .populate('merchantOrders.items.product', 'item price unit image')
            .populate('deliveryDate', 'date')
            .sort('-createdAt');
        
        console.log('Found orders:', JSON.stringify(orders, null, 2));
        res.json(orders);
    } catch (err) {
        console.error('Error in /my-orders:', err);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark order as rated
router.post('/:orderId/rate', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'Token required' });

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (verified.role !== 'customer') {
            return res.status(401).json({ message: 'Invalid token' });
        }

        const order = await Order.findOne({ 
            _id: req.params.orderId,
            customer: verified.id
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.isRated = true;
        await order.save();
        res.json({ message: 'Order marked as rated' });
    } catch (error) {
        console.error('Error marking order as rated:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
