const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const MerchantShop = require('../../models/MerchantShop');

// Configure multer for file upload
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

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

// Get merchant's shop information
router.get('/', async (req, res) => {
    try {
        const shop = await getMerchantShop(req);
        if (!shop) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        res.json(shop);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update merchant's shop information
router.put('/', upload.single('image'), async (req, res) => {
    try {
        const shop = await getMerchantShop(req);
        if (!shop) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { businessName, description, category, locationString, coordinates } = req.body;
        if (!businessName || !description || !category || !locationString) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if any data has changed
        const hasChanges = 
            businessName !== shop.businessName ||
            description !== shop.description ||
            category !== shop.category ||
            locationString !== shop.locationString ||
            (coordinates && (!shop.coordinates || 
                coordinates.lat !== shop.coordinates.lat || 
                coordinates.lng !== shop.coordinates.lng)) ||
            req.file;

        if (hasChanges) {
            shop.businessName = businessName;
            shop.description = description;
            shop.category = category;
            shop.locationString = locationString;
            if (coordinates) {
                shop.coordinates = {
                    lat: parseFloat(coordinates.lat),
                    lng: parseFloat(coordinates.lng)
                };
            }
            shop.status = 'pending';

            if (req.file) {
                // Convert buffer to base64
                const base64Image = req.file.buffer.toString('base64');
                const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;
                
                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload(dataURI, {
                    folder: 'merchant-shops'
                });
                
                shop.image = result.secure_url;
            }
        }

        await shop.save();
        res.json(shop);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
