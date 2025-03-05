const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        maxLength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure one rating per user per product
ratingSchema.index({ productId: 1, userId: 1 }, { unique: true });

const Rating = mongoose.model('Rating', ratingSchema);
module.exports = Rating;
