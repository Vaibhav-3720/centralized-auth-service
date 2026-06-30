const jwt = require('jsonwebtoken');
const Blacklist = require('../models/blacklist');

/**
 * Express Middleware to verify JWT authenticity and check against token blacklists.
 */
const authGuard = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Validate formatting of authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied.', details: 'Missing or malformed Authorization header.' });
    }

    const token = authHeader.split(' ')[1];

    // Check if the token is present in the blacklisted collection
    const isBlacklisted = await Blacklist.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Access denied.', details: 'This token has been logged out/revoked.' });
    }

    // Verify JWT integrity
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeythatisextremelylongandsecure12345!');
    
    // Attach credentials/payload to request
    req.user = decoded;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access denied.', details: 'Token has expired.' });
    }
    return res.status(401).json({ error: 'Access denied.', details: 'Invalid token.' });
  }
};

module.exports = authGuard;
