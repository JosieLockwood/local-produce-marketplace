const mongoose = require('mongoose');

const deliveryDateSchema = new mongoose.Schema({
    date: { 
        type: Date, 
        required: true, 
        unique: true 
    },
    status: { 
        type: String, 
        required: true,
        enum: ['open', 'closed', 'full', 'past'],
        default: 'open'
    },
    maxOrders: {
        type: Number,
        required: true,
        min: 1
    }
}, {
    timestamps: true
});

// Update status to 'past' for dates that have passed
deliveryDateSchema.pre('save', function(next) {
    if (this.date < new Date()) {
        this.status = 'past';
    }
    next();
});

// Static method to update past dates
deliveryDateSchema.statics.updatePastDates = async function() {
    const now = new Date();
    await this.updateMany(
        { 
            date: { $lt: now },
            status: { $ne: 'past' }
        },
        { status: 'past' }
    );
};

// Static method to check and update full status
deliveryDateSchema.statics.checkAndUpdateFullStatus = async function(deliveryDateId) {
    const Order = mongoose.model('Order');
    const deliveryDate = await this.findById(deliveryDateId);
    
    if (!deliveryDate || deliveryDate.status === 'past') return;

    const orderCount = await Order.countDocuments({ deliveryDate: deliveryDateId });
    
    if (orderCount >= deliveryDate.maxOrders && deliveryDate.status !== 'full') {
        deliveryDate.status = 'full';
        await deliveryDate.save();
    } else if (orderCount < deliveryDate.maxOrders && deliveryDate.status === 'full') {
        deliveryDate.status = 'open';
        await deliveryDate.save();
    }
};

module.exports = mongoose.model('DeliveryDate', deliveryDateSchema);
