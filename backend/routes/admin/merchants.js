const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const MerchantShop = require('../../models/MerchantShop');

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

// List all merchants with their shop details
router.get('/', async (req, res) => {
    try {
        const adminId = await verifyAdmin(req);
        if (!adminId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const merchants = await User.find({ role: 'merchant' }).select('-password');
        const merchantShops = await MerchantShop.find();

        // Combine user and shop data
        const combinedData = merchants.map(merchant => {
            const shop = merchantShops.find(shop => shop.userId.toString() === merchant._id.toString());
            return {
                _id: merchant._id,
                email: merchant.email,
                name: merchant.name,
                shop: shop || null
            };
        });

        res.json(combinedData);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new merchant
router.post('/', async (req, res) => {
    try {
        const adminId = await verifyAdmin(req);
        if (!adminId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { email, name, password, businessName, description, category, locationString } = req.body;

        // Check if email exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Create merchant user
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        const merchant = new User({
            email,
            password: hashedPassword,
            name,
            role: 'merchant'
        });
        await merchant.save();

        // Create merchant shop
        const shop = new MerchantShop({
            userId: merchant._id,
            businessName,
            description,
            category,
            locationString,
            status: 'pending'
        });
        await shop.save();

        // Return combined data
        res.status(201).json({
            _id: merchant._id,
            email: merchant.email,
            name: merchant.name,
            shop
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update merchant shop status
router.patch('/:shopId/status', async (req, res) => {
    try {
        const adminId = await verifyAdmin(req);
        if (!adminId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { status } = req.body;
        if (!['pending', 'approved', 'delisted'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const shop = await MerchantShop.findByIdAndUpdate(
            req.params.shopId,
            { status },
            { new: true }
        );

        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        const merchant = await User.findById(shop.userId).select('-password');
        
        res.json({
            _id: merchant._id,
            email: merchant.email,
            name: merchant.name,
            shop
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
