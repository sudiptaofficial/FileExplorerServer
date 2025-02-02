// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Register endpoint (for testing/demo)
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login endpoint: returns a JWT token if credentials are valid.
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
   
    const user = await User.findOne({ username });
   
    if (!user || !(await user.comparePassword(password))) {
      
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Create JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    console.log("token",token)
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
