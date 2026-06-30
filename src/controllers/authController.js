const User = require('../models/user');
const Blacklist = require('../models/blacklist');
const { hashPassword, verifyPassword } = require('../utils/crypto');
const jwt = require('jsonwebtoken');

/**
 * Handle user registration
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Basic payload check
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if the username or email is already registered
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email.toLowerCase().trim()) {
        return res.status(400).json({ error: 'Email is already registered.' });
      }
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    // Hash password with native scrypt utility
    const hashedPassword = await hashPassword(password);

    // Save user to database
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error during registration.', details: error.message });
  }
};

/**
 * Handle user login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check parameters
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify password match using native utility
    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT token with a 1 hour duration
    const jwtSecret = process.env.JWT_SECRET || 'supersecretkeythatisextremelylongandsecure12345!';
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      jwtSecret,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful.',
      token,
      expiresIn: '1h',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error during login.', details: error.message });
  }
};

/**
 * Handle user logout (Token revocation)
 */
exports.logout = async (req, res) => {
  try {
    const token = req.token;
    const decoded = req.user;

    // Calculate actual token expiry date to optimize DB storage
    // decoded.exp is UNIX epoch seconds
    const expiryDate = decoded && decoded.exp 
      ? new Date(decoded.exp * 1000) 
      : new Date(Date.now() + 60 * 60 * 1000); // fallback to 1 hour from now

    // Check if token is already in blacklist to prevent duplicate entries
    const isAlreadyBlacklisted = await Blacklist.findOne({ token });
    if (!isAlreadyBlacklisted) {
      await Blacklist.create({
        token,
        expiresAt: expiryDate
      });
    }

    res.status(200).json({ message: 'Logout successful. Token revoked.' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error during logout.', details: error.message });
  }
};
