const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Extract token (header looks like "Bearer eyJhbG...")
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const apiKeyAuth = async (req, res, next) => {
    try {
        const xapikey = req.headers['x-api-key'];
        const user = await User.findOne({apiKey: xapikey});

        if (!user) return res.status(401).json({error: 'Invalid key'});

        req.user = user;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid Key' });
    }
}
const flexAuth = async (req, res, next) => {
    // Try JWT first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authenticate(req, res, next);
    }

    // Fall back to API key
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
        return apiKeyAuth(req, res, next);
    }

    return res.status(401).json({ error: 'No authentication provided' });
};

module.exports = { authenticate, apiKeyAuth, flexAuth };