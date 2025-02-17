const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Configure dotenv to look for .env in the root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend directory
app.use(express.static('frontend'));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB:', err));

// Auth Routes
app.use('/api/customer/auth', require('./routes/customer/auth'));
app.use('/api/merchant/auth', require('./routes/merchant/auth'));
app.use('/api/admin/auth', require('./routes/admin/auth'));

// Admin Routes
app.use('/api/admin/products', require('./routes/admin/products'));
app.use('/api/admin/merchants', require('./routes/admin/merchants'));
app.use('/api/admin/orders', require('./routes/admin/orders'));
app.use('/api/admin/delivery-dates', require('./routes/admin/delivery-dates'));

// Customer Routes
app.use('/api/customer/browse', require('./routes/customer/browse'));
app.use('/api/customer/orders', require('./routes/customer/orders'));

// Merchant Routes
app.use('/api/merchant/products', require('./routes/merchant/products'));
app.use('/api/merchant/orders', require('./routes/merchant/orders'));
app.use('/api/merchant/shop', require('./routes/merchant/shop'));
app.use('/api/merchant/delivery-dates', require('./routes/merchant/delivery-dates'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
