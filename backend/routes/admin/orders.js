const router = require('express').Router();
const jwt = require('jsonwebtoken');
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

// List all orders with customer and merchant details
router.get('/', async (req, res) => {
    try {
        const adminId = await verifyAdmin(req);
        if (!adminId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { deliveryDate } = req.query;
        
        let query = {};
        if (deliveryDate) {
            query.deliveryDate = deliveryDate;
        }

        const orders = await Order.find(query)
            .populate('customer', 'name email')
            .populate({
                path: 'deliveryDate',
                select: 'date status'
            })
            .populate({
                path: 'merchantOrders.merchant',
                select: 'businessName locationString'
            })
            .populate({
                path: 'merchantOrders.items.product',
                select: 'item price unit'
            })
            .sort('-createdAt');

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update merchant order status
router.patch('/:orderId/merchant/:merchantOrderId/status', async (req, res) => {
    try {
        const adminId = await verifyAdmin(req);
        if (!adminId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { status } = req.body;
        if (!['created', 'ready', 'at depot'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const merchantOrder = order.merchantOrders.id(req.params.merchantOrderId);
        if (!merchantOrder) {
            return res.status(404).json({ message: 'Merchant order not found' });
        }

        merchantOrder.status = status;
        await order.save();

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update order status
router.patch('/:orderId/status', async (req, res) => {
    try {
        const adminId = await verifyAdmin(req);
        if (!adminId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { status } = req.body;
        if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.orderId,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
