const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Product = require('../../models/Product');

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

// List all products with merchant details
router.get('/', async (req, res) => {
    try {
        const adminId = await verifyAdmin(req);
        if (!adminId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const products = await Product.find()
            .populate({
                path: 'merchantId',
                select: 'businessName locationString'
            })
            .sort('-createdAt');

        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update product status
router.patch('/:id/status', async (req, res) => {
    try {
        const adminId = await verifyAdmin(req);
        if (!adminId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { status } = req.body;
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('merchantId', 'businessName locationString');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
