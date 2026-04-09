const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const Url = require('../models/Url');
require('dotenv').config();

const connection = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
};

// We require io here — it's exported from index.js
let io;
const setIO = (socketIO) => {
    io = socketIO;
};

const worker = new Worker('clicks', async (job) => {
    const { urlId } = job.data;

    const url = await Url.findOneAndUpdate(
        { _id: urlId },
        { $inc: { clicks: 1 } },
        { returnDocument: 'after' }
    );

    console.log(`Click counted for URL: ${urlId}`);

    // Emit real-time event to all connected dashboard clients
    if (io) {
        io.emit('new-click', {
            urlId,
            slug: url.slug,
            clicks: url.clicks,
        });
    }
}, { connection });

worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err.message);
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Worker connected to MongoDB'))
    .catch((err) => console.error('Worker MongoDB error:', err.message));

module.exports = { worker, setIO };