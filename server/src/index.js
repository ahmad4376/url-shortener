const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const { authenticate, flexAuth } = require('./middleware/auth');
const urlRoutes = require('./routes/url');
const Url = require('./models/Url');
const redis = require('./config/redis');
const clickQueue = require('./queues/clickQueue');
const { worker, setIO } = require('./queues/clickWorker');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');



const app = express();
const httpServer = http.createServer(app); // explicit HTTP server
const io = new Server(httpServer, {
    cors: { origin: '*' }
});

setIO(io);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());


// Socket.io connection handler
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});


app.get('/api/me', authenticate, (req, res) => {
    res.json({ id: req.user._id, email: req.user.email });
});


app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/urls', apiLimiter, flexAuth, urlRoutes);

app.get('/:slug', async (req, res) => {
    try {
        const slug = req.params.slug;

        const slugInCache = await redis.get(`url:${slug}`);
        if (slugInCache) {
            const urlObject = JSON.parse(slugInCache);
            await clickQueue.add('clicks', { urlId: urlObject._id });
            res.redirect(urlObject.longUrl);
        } else {
            const slugExists = await Url.findOne({ slug });
            if (!slugExists) return res.status(404).json({ error: 'No matching URL found' });
            if (!slugExists.isActive) return res.status(410).json({ error: 'This link is no longer active' });

            await clickQueue.add('clicks', { urlId: slugExists._id });
            await redis.set(`url:${slug}`, JSON.stringify(slugExists), 'EX', 86400);
            res.redirect(slugExists.longUrl);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Connect to MongoDB then start server
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    });

module.exports = { io };