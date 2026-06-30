// In-memory store to track request timestamps per client IP
const rateLimitStore = new Map();

// Configuration
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_LIMIT = 5; // 5 requests

/**
 * Custom Rate Limiting Middleware.
 * Tracks client requests by IP and enforces limits.
 */
const rateLimiter = (req, res, next) => {
  // Extract client IP address
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();

  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, [now]);
    return next();
  }

  const timestamps = rateLimitStore.get(ip);
  
  // Filter out any timestamps older than our sliding window
  const validTimestamps = timestamps.filter(timestamp => now - timestamp < WINDOW_MS);
  
  if (validTimestamps.length >= MAX_LIMIT) {
    // Save the filtered timestamps to the store to keep it fresh
    rateLimitStore.set(ip, validTimestamps);
    return res.status(429).json({
      error: 'Too many requests.',
      message: `Rate limit exceeded. Maximum ${MAX_LIMIT} requests per minute. Please try again later.`
    });
  }

  // Record this current request's timestamp
  validTimestamps.push(now);
  rateLimitStore.set(ip, validTimestamps);
  
  next();
};

// Periodic garbage collection to remove idle IP entries and prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitStore.entries()) {
    const validTimestamps = timestamps.filter(timestamp => now - timestamp < WINDOW_MS);
    if (validTimestamps.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, validTimestamps);
    }
  }
}, 5 * 60 * 1000).unref(); // .unref() ensures this timer does not prevent the process from terminating

module.exports = rateLimiter;
