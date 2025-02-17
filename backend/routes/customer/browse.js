const router = require('express').Router();
const Product = require('../../models/Product');
const MerchantShop = require('../../models/MerchantShop');

// Get all active products
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find({ 
            status: 'approved',
            inStock: true 
        }).populate('merchantId', '_id businessName locationString');
        
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all active merchants
router.get('/merchants', async (req, res) => {
    try {
        const merchants = await MerchantShop.find({ 
            status: 'approved' 
        }).select('_id businessName description locationString category image');
        
        res.json(merchants);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get specific merchant with their products
router.get('/merchants/:merchantId', async (req, res) => {
    try {
        const merchant = await MerchantShop.findOne({
            _id: req.params.merchantId,
            status: 'approved'
        }).select('_id businessName description locationString category image');
        
        if (!merchant) {
            return res.status(404).json({ message: 'Merchant not found' });
        }

        const products = await Product.find({
            merchantId: req.params.merchantId,
            status: 'approved',
            inStock: true
        });

        res.json({
            merchant,
            products
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
