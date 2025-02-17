const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

// Merchant Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user and verify role
        const user = await User.findOne({ email, role: 'merchant' });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

        // Create token
        const token = jwt.sign(
            { id: user._id, role: 'merchant' },
            process.env.JWT_SECRET
        );

        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Merchant Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already exists' });

        // Hash password
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = new User({
            email,
            password: hashedPassword,
            name,
            role: 'merchant'
        });

        await user.save();
        res.status(201).json({ message: 'Registration successful' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
