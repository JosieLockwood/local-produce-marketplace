const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

// Admin Login Only - No Registration
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user and verify role
        const user = await User.findOne({ email, role: 'admin' });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

        // Create token
        const token = jwt.sign(
            { id: user._id, role: 'admin' },
            process.env.JWT_SECRET
        );

        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
