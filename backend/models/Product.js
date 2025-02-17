const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    merchantId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'MerchantShop', 
        required: true 
    },
    item: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    price: { 
        type: Number, 
        required: true 
    },
    unit: { 
        type: String, 
        required: true 
    },
    category: String,
    localityCategory: { 
        type: String, 
        required: true,
        enum: ['own_product', 'local_50', 'regional_100', 'uk', 'imported'],
        default: 'own_product'
    },
    coordinates: {
        lat: Number,
        lng: Number
    },
    producer: String,
    image: String,
    inStock: { 
        type: Boolean, 
        default: true 
    },
    status: { 
        type: String, 
        required: true, 
        enum: ['pending', 'approved', 'delisted'],
        default: 'pending'
    },
    rating: {
        average: { 
            type: Number, 
            default: 0 
        },
        count: { 
            type: Number, 
            default: 0 
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
