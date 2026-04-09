const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');

// General API rate limiter — 100 requests per 15 minutes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args),
    }),
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many requests, please try again later.',
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
        });
    },
});

// Strict limiter for auth routes — 10 requests per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args),
    }),
    handler: (req, res) => {
    res.status(429).json({
        error: 'Too many login attempts, please try again later.',
        retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
    });
},
});

module.exports = { apiLimiter, authLimiter };