require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@local.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const admin = new User({
            email: 'admin@local.com',
            password: hashedPassword,
            name: 'Admin',
            role: 'admin'
        });

        await admin.save();
        console.log('Admin user created successfully');
        console.log('Email: admin@local.com');
        console.log('Password: admin123');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createAdmin();
