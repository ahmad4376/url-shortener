const express = require('express')
const Url = require('../models/Url')
const redis = require('../config/redis');

function validateLongUrl(longUrl) {
    try {
        const url = new URL(longUrl);
        return true;
    } catch (error) {
        return false;
    }

}

// Generate unique slug with collision handling
async function generateUniqueSlug() {
    let slug;
    let exists = true;

    while (exists) {
        slug = Math.random().toString(36).slice(2, 8);
        exists = await Url.findOne({ slug });
    }

    return slug;
}

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { longUrl } = req.body;

        if (!longUrl) return res.status(400).json({ error: "Long Url is required" });
        if (!validateLongUrl(longUrl)) return res.status(400).json({ error: "Invalid longUrl" });

        const slug = await generateUniqueSlug();

        const url = await Url.create({
            longUrl,
            slug,
            user: req.user._id
        });


        res.status(201).json({
            message: "Url saved successfully",
            urlobject: url
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }
})

router.get('/', async (req, res) => {
    try {
        const userId = req.user._id;

        const urls = await Url.find({
            user: userId
        }).sort({ createdAt: -1 });

        res.status(200).json({
            urls: urls
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user._id;
        const url = await Url.findById(id);
        if (!url) return res.status(404).json({ error: 'No URL found with that id' });
        if (url.user.toString() !== userId.toString()) return res.status(403).json({ error: 'Forbidden' });

        await Url.deleteOne({ _id: id });
        await redis.del(`url:${url.slug}`);
        res.status(200).json({ message: 'URL deleted successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }
})

router.patch('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user._id;
        const url = await Url.findOne({ _id: id });
        if (!url) return res.status(404).json({ error: 'No URL found with that id' });
        if (url.user.toString() !== userId.toString()) return res.status(403).json({ error: 'Forbidden' });

        const updated = await Url.findOneAndUpdate(
            { _id: id },
            { $set: { isActive: !url.isActive } },
            { returnDocument: 'after' }
        );

        await redis.del(`url:${url.slug}`);
        res.status(200).json({ message: 'URL updated successfully', url: updated });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }
})



module.exports = router;