const mongoose = require('mongoose');

const merchantShopSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true 
    },
    businessName: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    category: { 
        type: String, 
        required: true,
        enum: ['Fruit & Veg', 'Bakery', 'Butchers', 'Dairy', 'Farmer', 'Other']
    },
    coordinates: {
        lat: Number,
        lng: Number
    },
    locationString: { 
        type: String, 
        required: true 
    },
    image: String,
    status: { 
        type: String, 
        required: true, 
        enum: ['pending', 'approved', 'delisted'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MerchantShop', merchantShopSchema);
