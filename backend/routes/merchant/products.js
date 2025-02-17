const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Product = require('../../models/Product');
const MerchantShop = require('../../models/MerchantShop');
const { cloudinary, upload } = require('../../config/cloudinary');

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

// List merchant's products
router.get('/', async (req, res) => {
    try {
        const merchantId = await getMerchantId(req);
        if (!merchantId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const products = await Product.find({ merchantId });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const merchantId = await getMerchantId(req);
        if (!merchantId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const product = await Product.findOne({ _id: req.params.id, merchantId });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new product
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const merchantId = await getMerchantId(req);
        if (!merchantId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        let imageUrl = null;
        if (req.file) {
            // Convert buffer to base64
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;
            
            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'products'
            });
            imageUrl = result.secure_url;
        }

        const product = new Product({
            ...req.body,
            merchantId,
            image: imageUrl,
            status: 'pending'
        });

        await product.save();
        res.status(201).json(product);
    } catch (err) {
        console.error('Error:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Update product
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const merchantId = await getMerchantId(req);
        if (!merchantId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const updateData = { ...req.body };

        if (req.file) {
            // Convert buffer to base64
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;
            
            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'products'
            });
            updateData.image = result.secure_url;
        }

        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, merchantId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (err) {
        console.error('Error:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle product stock status
router.patch('/:id/stock', async (req, res) => {
    try {
        const merchantId = await getMerchantId(req);
        if (!merchantId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const product = await Product.findOne({ _id: req.params.id, merchantId });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.inStock = !product.inStock;
        await product.save();

        res.json(product);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const merchantId = await getMerchantId(req);
        if (!merchantId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const product = await Product.findOneAndDelete({ _id: req.params.id, merchantId });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
