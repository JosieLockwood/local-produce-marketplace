const mongoose = require('mongoose');

// Item in an order
const orderItemSchema = new mongoose.Schema({
    product: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
    },
    quantity: { 
        type: Number, 
        required: true 
    },
    price: { 
        type: Number, 
        required: true 
    },
    rating: {
        score: { 
            type: Number, 
            min: 1, 
            max: 5 
        },
        ratedAt: Date
    }
});

// Per-merchant portion of order
const merchantOrderSchema = new mongoose.Schema({
    merchant: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'MerchantShop', 
        required: true 
    },
    items: [orderItemSchema],
    status: {
        type: String,
        enum: ['created', 'ready', 'at depot'],
        default: 'created'
    }
});

// Main order schema
const orderSchema = new mongoose.Schema({
    customer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    merchantOrders: [merchantOrderSchema],
    deliveryDate: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'DeliveryDate', 
        required: true 
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'all at depot', 'out for delivery', 'delivered'],
        default: 'pending'
    },
    totalAmount: { 
        type: Number, 
        required: true 
    },
    isRated: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
