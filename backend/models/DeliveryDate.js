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
        enum: ['open', 'closed', 'past'],
        default: 'open'
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

module.exports = mongoose.model('DeliveryDate', deliveryDateSchema);
