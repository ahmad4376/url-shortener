const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

function validateAuthInput(email, password) {
  if (!validateEmail(email)) return 'Invalid email address';
  if (!validatePassword(password)) return 'Password must be at least 6 characters long';
  return null; // null means no error
}
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const validationError = validateAuthInput(email, password);
    if (validationError) return res.status(400).json({ error: validationError });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user (password gets hashed automatically via pre-save hook)
    const user = await User.create({ email, password });

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const validationError = validateAuthInput(email, password);
    if (validationError) return res.status(400).json({ error: validationError });

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/generate-key', authenticate, async (req, res) => {
  try {
    const apiKey = 'sk_' + require('crypto').randomBytes(24).toString('hex');
    const user = await User.findOneAndUpdate(
      { _id: req.user._id },           // find this user
      { $set: { apiKey: apiKey } },    // set their apiKey
      { new: true }                    // return updated document
    );


    res.status(201).json({ message: "Please save this API key, it won't be shown again.", apiKey: apiKey });
  } catch (error) {
    res.status(400).json({ error: "Server error" });
  }
})

module.exports = router;