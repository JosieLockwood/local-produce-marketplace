const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Order = require('../../models/Order');
const MerchantShop = require('../../models/MerchantShop');

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

// List merchant's orders
router.get('/', async (req, res) => {
    try {
        const merchantId = await getMerchantId(req);
        if (!merchantId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Find all orders where this merchant is involved
        const orders = await Order.find({
            'merchantOrders.merchant': merchantId
        })
        .populate('customer', 'name email')
        .populate('deliveryDate')
        .populate({
            path: 'merchantOrders.items.product',
            select: 'item description price unit'
        })
        .sort({ 'deliveryDate': 1 }); // Sort by delivery date ascending

        // Filter to only include this merchant's portion of each order
        const filteredOrders = orders.map(order => {
            const merchantOrder = order.merchantOrders.find(mo => mo.merchant.toString() === merchantId.toString());
            if (!merchantOrder) return null;

            return {
                _id: order._id,
                customer: order.customer,
                deliveryDate: order.deliveryDate,
                totalAmount: order.totalAmount,
                merchantOrder: merchantOrder
            };
        }).filter(Boolean);

        res.json(filteredOrders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update merchant order status
router.patch('/:orderId/status', async (req, res) => {
    try {
        const merchantId = await getMerchantId(req);
        if (!merchantId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { status } = req.body;
        if (!status || !['created', 'ready', 'at depot'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Find and update the merchant's portion of the order
        const merchantOrder = order.merchantOrders.find(
            mo => mo.merchant.toString() === merchantId.toString()
        );

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

module.exports = router;
